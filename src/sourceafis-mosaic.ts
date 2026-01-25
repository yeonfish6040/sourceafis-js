import {
  ImageOptions,
  _getClasses,
  createMatcher,
  matchWithMatcher,
  templateFromBytes,
  templateFromEncoded,
} from "./sourceafis";

const java: any = require("java");

export type MinutiaType = "ending" | "bifurcation";

export interface MinutiaPoint {
  x: number;
  y: number;
  direction: number;
  type: MinutiaType;
}

export interface MosaicTemplate {
  width: number;
  height: number;
  minutiae: MinutiaPoint[];
}

export interface MosaicTransform {
  rotation: number;
  cos: number;
  sin: number;
  tx: number;
  ty: number;
}

export interface MosaicOptions {
  mergeMatched?: "probe" | "candidate" | "average";
  includeUnmatched?: boolean;
}

export interface MosaicResult {
  template: MosaicTemplate;
  transform: MosaicTransform;
  pairs: Array<{ probe: number; candidate: number }>;
  score: number;
}

export interface ImageMergeOptions {
  alpha?: number;
  backgroundThreshold?: number;
}

function isByteArray(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}

function toNumberArray(arrayLike: any): number[] {
  if (Array.isArray(arrayLike)) {
    return arrayLike.map((v) => Number(v));
  }
  if (arrayLike == null || typeof arrayLike.length !== "number") {
    return [];
  }
  const out: number[] = new Array(arrayLike.length);
  for (let i = 0; i < arrayLike.length; i += 1) {
    out[i] = Number(arrayLike[i]);
  }
  return out;
}

function persistentToTemplate(persistent: any): MosaicTemplate {
  const width = Number(persistent.widthSync());
  const height = Number(persistent.heightSync());
  const xs = toNumberArray(persistent.positionsXSync());
  const ys = toNumberArray(persistent.positionsYSync());
  const dirs = toNumberArray(persistent.directionsSync());
  const types: string = persistent.typesSync();
  const minutiae: MinutiaPoint[] = [];
  for (let i = 0; i < types.length; i += 1) {
    minutiae.push({
      x: xs[i],
      y: ys[i],
      direction: dirs[i],
      type: types.charAt(i) === "B" ? "bifurcation" : "ending",
    });
  }
  return { width, height, minutiae };
}

function extractPairs(pairing: any): Array<{ probe: number; candidate: number }> {
  const pairs: Array<{ probe: number; candidate: number }> = [];
  const root = pairing.rootSync();
  pairs.push({ probe: Number(root.probeSync()), candidate: Number(root.candidateSync()) });
  const tree = pairing.treeSync();
  if (Array.isArray(tree)) {
    for (const edge of tree) {
      pairs.push({ probe: Number(edge.probeFromSync()), candidate: Number(edge.candidateFromSync()) });
      pairs.push({ probe: Number(edge.probeToSync()), candidate: Number(edge.candidateToSync()) });
    }
  }
  const unique = new Map<number, number>();
  for (const pair of pairs) {
    if (!unique.has(pair.candidate)) {
      unique.set(pair.candidate, pair.probe);
    }
  }
  return Array.from(unique, ([candidate, probe]) => ({ probe, candidate }));
}

function computeTransform(
  pairs: Array<{ probe: number; candidate: number }>,
  probe: MosaicTemplate,
  candidate: MosaicTemplate
): MosaicTransform {
  if (pairs.length === 0) {
    throw new Error("No paired minutiae available for mosaicking.");
  }
  const matchedProbe: Array<{ x: number; y: number; direction: number }> = [];
  const matchedCandidate: Array<{ x: number; y: number; direction: number }> = [];
  for (const pair of pairs) {
    const p = probe.minutiae[pair.probe];
    const c = candidate.minutiae[pair.candidate];
    if (p && c) {
      matchedProbe.push(p);
      matchedCandidate.push(c);
    }
  }
  if (matchedProbe.length === 0) {
    throw new Error("Paired minutiae do not reference valid indices.");
  }

  let rotation = 0;
  if (matchedProbe.length === 1) {
    rotation = matchedProbe[0].direction - matchedCandidate[0].direction;
  } else {
    let sumPx = 0;
    let sumPy = 0;
    let sumCx = 0;
    let sumCy = 0;
    for (let i = 0; i < matchedProbe.length; i += 1) {
      sumPx += matchedProbe[i].x;
      sumPy += matchedProbe[i].y;
      sumCx += matchedCandidate[i].x;
      sumCy += matchedCandidate[i].y;
    }
    const meanPx = sumPx / matchedProbe.length;
    const meanPy = sumPy / matchedProbe.length;
    const meanCx = sumCx / matchedCandidate.length;
    const meanCy = sumCy / matchedCandidate.length;
    let sumDot = 0;
    let sumCross = 0;
    for (let i = 0; i < matchedProbe.length; i += 1) {
      const pcx = matchedCandidate[i].x - meanCx;
      const pcy = matchedCandidate[i].y - meanCy;
      const ppx = matchedProbe[i].x - meanPx;
      const ppy = matchedProbe[i].y - meanPy;
      sumDot += pcx * ppx + pcy * ppy;
      sumCross += pcx * ppy - pcy * ppx;
    }
    rotation = Math.atan2(sumCross, sumDot);
  }

  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const refProbe = matchedProbe[0];
  const refCandidate = matchedCandidate[0];
  const tx = refProbe.x - (cos * refCandidate.x - sin * refCandidate.y);
  const ty = refProbe.y - (sin * refCandidate.x + cos * refCandidate.y);

  return { rotation, cos, sin, tx, ty };
}

function applyTransform(point: MinutiaPoint, transform: MosaicTransform): MinutiaPoint {
  const x = transform.cos * point.x - transform.sin * point.y + transform.tx;
  const y = transform.sin * point.x + transform.cos * point.y + transform.ty;
  return {
    x,
    y,
    direction: point.direction + transform.rotation,
    type: point.type,
  };
}

function normalizeTemplate(template: MosaicTemplate): MosaicTemplate {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const m of template.minutiae) {
    minX = Math.min(minX, m.x);
    minY = Math.min(minY, m.y);
    maxX = Math.max(maxX, m.x);
    maxY = Math.max(maxY, m.y);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return template;
  }
  const shiftX = minX < 0 ? -minX : 0;
  const shiftY = minY < 0 ? -minY : 0;
  const shifted = template.minutiae.map((m) => ({
    ...m,
    x: m.x + shiftX,
    y: m.y + shiftY,
  }));
  const width = Math.max(template.width, Math.ceil(maxX + shiftX + 1));
  const height = Math.max(template.height, Math.ceil(maxY + shiftY + 1));
  return { width, height, minutiae: shifted };
}

function capturePairing(probeTemplate: any, candidateTemplate: any): {
  pairing: any;
  probeTemplate: MosaicTemplate | null;
  candidateTemplate: MosaicTemplate | null;
  score: number;
  pairs: Array<{ probe: number; candidate: number }>;
} {
  _getClasses();
  const TransparencyBuffer = java.import("com.machinezoo.sourceafis.transparency.TransparencyBuffer");
  const BestPairingKey = java.import("com.machinezoo.sourceafis.transparency.keys.BestPairingKey");
  const PairingKey = java.import("com.machinezoo.sourceafis.transparency.keys.PairingKey");
  const RootsKey = java.import("com.machinezoo.sourceafis.transparency.keys.RootsKey");
  const buffer = new TransparencyBuffer();
  const transparency = buffer.openSync();
  let score = 0;
  try {
    const matcher = createMatcher(probeTemplate);
    score = matchWithMatcher(matcher, candidateTemplate);
  } finally {
    transparency.closeSync();
  }

  const archive = buffer.toArchiveSync();
  let pairingOpt = archive.deserializeSync(new BestPairingKey());
  if (!pairingOpt.isPresentSync()) {
    pairingOpt = archive.deserializeSync(new PairingKey());
  }
  let pairing: any | null = null;
  let pairs: Array<{ probe: number; candidate: number }> = [];
  if (pairingOpt.isPresentSync()) {
    pairing = pairingOpt.getSync();
    pairs = extractPairs(pairing);
  } else {
    const rootsOpt = archive.deserializeSync(new RootsKey());
    if (rootsOpt.isPresentSync()) {
      const roots = rootsOpt.getSync();
      const rootPairs: Array<{ probe: number; candidate: number }> = [];
      if (Array.isArray(roots)) {
        for (const pair of roots) {
          rootPairs.push({
            probe: Number(pair.probeSync()),
            candidate: Number(pair.candidateSync()),
          });
        }
      }
      const unique = new Map<number, number>();
      for (const pair of rootPairs) {
        if (!unique.has(pair.candidate)) {
          unique.set(pair.candidate, pair.probe);
        }
      }
      pairs = Array.from(unique, ([candidate, probe]) => ({ probe, candidate }));
    }
  }
  if (pairs.length === 0) {
    const keys = archive.keysSync ? archive.keysSync() : [];
    throw new Error(`Transparency data missing pairing/roots. Keys: ${keys}`);
  }

  return {
    pairing,
    probeTemplate: null,
    candidateTemplate: null,
    score,
    pairs,
  };
}

function toJavaBytes(buffer: Uint8Array): any {
  const bytes = new Array(buffer.length);
  for (let i = 0; i < buffer.length; i += 1) {
    const value = buffer[i];
    bytes[i] = value > 127 ? value - 256 : value;
  }
  return java.newArray("byte", bytes);
}

function decodePersistentTemplate(templateBytes: Uint8Array | any): any | null {
  const InputTemplateKey = java.import("com.machinezoo.sourceafis.transparency.keys.InputTemplateKey");
  const key = new InputTemplateKey();
  try {
    const javaBytes = templateBytes instanceof Uint8Array ? toJavaBytes(templateBytes) : templateBytes;
    return key.deserializeSync("application/cbor", javaBytes);
  } catch (error) {
    return null;
  }
}

export function mosaicFromTemplates(
  probeTemplate: any | Uint8Array,
  candidateTemplate: any | Uint8Array,
  options: MosaicOptions = {}
): MosaicResult {
  const probeBytes = isByteArray(probeTemplate)
    ? probeTemplate
    : probeTemplate?.toByteArraySync?.();
  const candidateBytes = isByteArray(candidateTemplate)
    ? candidateTemplate
    : candidateTemplate?.toByteArraySync?.();
  const resolvedProbe = isByteArray(probeTemplate) ? templateFromBytes(probeTemplate) : probeTemplate;
  const resolvedCandidate = isByteArray(candidateTemplate)
    ? templateFromBytes(candidateTemplate)
    : candidateTemplate;

  let { probeTemplate: probe, candidateTemplate: candidate, score, pairs } = capturePairing(
    resolvedProbe,
    resolvedCandidate
  );

  if (!probe && probeBytes) {
    const decoded = decodePersistentTemplate(probeBytes);
    if (decoded) {
      probe = persistentToTemplate(decoded);
    }
  }
  if (!candidate && candidateBytes) {
    const decoded = decodePersistentTemplate(candidateBytes);
    if (decoded) {
      candidate = persistentToTemplate(decoded);
    }
  }

  if (!probe || !candidate) {
    throw new Error(
      "Failed to decode minutiae from templates. Pass native SourceAFIS template bytes or FingerprintTemplate objects."
    );
  }
  const transform = computeTransform(pairs, probe, candidate);
  const mergeMatched = options.mergeMatched ?? "probe";
  const includeUnmatched = options.includeUnmatched ?? true;

  const pairedCandidates = new Set(pairs.map((pair) => pair.candidate));
  const resultMinutiae = probe.minutiae.map((m) => ({ ...m }));

  for (const pair of pairs) {
    const probeMinutia = probe.minutiae[pair.probe];
    const candidateMinutia = candidate.minutiae[pair.candidate];
    if (!probeMinutia || !candidateMinutia) {
      continue;
    }
    const transformed = applyTransform(candidateMinutia, transform);
    if (mergeMatched === "candidate") {
      resultMinutiae[pair.probe] = transformed;
    } else if (mergeMatched === "average") {
      resultMinutiae[pair.probe] = {
        x: (probeMinutia.x + transformed.x) / 2,
        y: (probeMinutia.y + transformed.y) / 2,
        direction: (probeMinutia.direction + transformed.direction) / 2,
        type: probeMinutia.type,
      };
    }
  }

  if (includeUnmatched) {
    for (let i = 0; i < candidate.minutiae.length; i += 1) {
      if (pairedCandidates.has(i)) {
        continue;
      }
      resultMinutiae.push(applyTransform(candidate.minutiae[i], transform));
    }
  }

  const mergedTemplate = normalizeTemplate({
    width: probe.width,
    height: probe.height,
    minutiae: resultMinutiae,
  });

  return {
    template: mergedTemplate,
    transform,
    pairs,
    score,
  };
}

export function mosaicFromImages(
  probeImage: Uint8Array,
  candidateImage: Uint8Array,
  imageOptions?: ImageOptions,
  options: MosaicOptions = {}
): MosaicResult {
  const probeTemplate = templateFromEncoded(probeImage, imageOptions ?? {});
  const candidateTemplate = templateFromEncoded(candidateImage, imageOptions ?? {});
  return mosaicFromTemplates(probeTemplate, candidateTemplate, options);
}

export function mosaicImages(
  probePng: Uint8Array,
  candidatePng: Uint8Array,
  transform: MosaicTransform,
  options: ImageMergeOptions = {}
): Uint8Array {
  const { PNG } = require("pngjs");
  const probe = PNG.sync.read(Buffer.from(probePng));
  const candidate = PNG.sync.read(Buffer.from(candidatePng));

  const output = new PNG({ width: probe.width, height: probe.height });
  probe.data.copy(output.data);

  const alphaScale = Math.max(0, Math.min(1, options.alpha ?? 1));
  const threshold = options.backgroundThreshold;

  const candData = candidate.data;
  for (let y = 0; y < candidate.height; y += 1) {
    for (let x = 0; x < candidate.width; x += 1) {
      const idx = (candidate.width * y + x) << 2;
      const r = candData[idx];
      const g = candData[idx + 1];
      const b = candData[idx + 2];
      const a = candData[idx + 3];
      if (a === 0) {
        continue;
      }
      if (threshold != null && r >= threshold && g >= threshold && b >= threshold) {
        continue;
      }

      const outX = Math.round(transform.cos * x - transform.sin * y + transform.tx);
      const outY = Math.round(transform.sin * x + transform.cos * y + transform.ty);
      if (outX < 0 || outY < 0 || outX >= output.width || outY >= output.height) {
        continue;
      }

      const outIdx = (output.width * outY + outX) << 2;
      const srcAlpha = (a / 255) * alphaScale;
      if (srcAlpha <= 0) {
        continue;
      }
      const dstAlpha = 1 - srcAlpha;
      output.data[outIdx] = Math.round(r * srcAlpha + output.data[outIdx] * dstAlpha);
      output.data[outIdx + 1] = Math.round(g * srcAlpha + output.data[outIdx + 1] * dstAlpha);
      output.data[outIdx + 2] = Math.round(b * srcAlpha + output.data[outIdx + 2] * dstAlpha);
      output.data[outIdx + 3] = 255;
    }
  }

  return PNG.sync.write(output);
}
