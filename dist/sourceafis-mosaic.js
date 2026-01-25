"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mosaicFromTemplates = mosaicFromTemplates;
exports.mosaicFromImages = mosaicFromImages;
exports.mosaicImages = mosaicImages;
const sourceafis_1 = require("./sourceafis");
const java = require("java");
function isByteArray(value) {
    return value instanceof Uint8Array;
}
function toNumberArray(arrayLike) {
    if (Array.isArray(arrayLike)) {
        return arrayLike.map((v) => Number(v));
    }
    if (arrayLike == null || typeof arrayLike.length !== "number") {
        return [];
    }
    const out = new Array(arrayLike.length);
    for (let i = 0; i < arrayLike.length; i += 1) {
        out[i] = Number(arrayLike[i]);
    }
    return out;
}
function persistentToTemplate(persistent) {
    const width = Number(persistent.widthSync());
    const height = Number(persistent.heightSync());
    const xs = toNumberArray(persistent.positionsXSync());
    const ys = toNumberArray(persistent.positionsYSync());
    const dirs = toNumberArray(persistent.directionsSync());
    const types = persistent.typesSync();
    const minutiae = [];
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
function extractPairs(pairing) {
    const pairs = [];
    const root = pairing.rootSync();
    pairs.push({ probe: Number(root.probeSync()), candidate: Number(root.candidateSync()) });
    const tree = pairing.treeSync();
    if (Array.isArray(tree)) {
        for (const edge of tree) {
            pairs.push({ probe: Number(edge.probeFromSync()), candidate: Number(edge.candidateFromSync()) });
            pairs.push({ probe: Number(edge.probeToSync()), candidate: Number(edge.candidateToSync()) });
        }
    }
    const unique = new Map();
    for (const pair of pairs) {
        if (!unique.has(pair.candidate)) {
            unique.set(pair.candidate, pair.probe);
        }
    }
    return Array.from(unique, ([candidate, probe]) => ({ probe, candidate }));
}
function computeTransform(pairs, probe, candidate) {
    if (pairs.length === 0) {
        throw new Error("No paired minutiae available for mosaicking.");
    }
    const matchedProbe = [];
    const matchedCandidate = [];
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
    }
    else {
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
function applyTransform(point, transform) {
    const x = transform.cos * point.x - transform.sin * point.y + transform.tx;
    const y = transform.sin * point.x + transform.cos * point.y + transform.ty;
    return {
        x,
        y,
        direction: point.direction + transform.rotation,
        type: point.type,
    };
}
function normalizeTemplate(template) {
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
function capturePairing(probeTemplate, candidateTemplate) {
    (0, sourceafis_1._getClasses)();
    const TransparencyBuffer = java.import("com.machinezoo.sourceafis.transparency.TransparencyBuffer");
    const BestPairingKey = java.import("com.machinezoo.sourceafis.transparency.keys.BestPairingKey");
    const ProbeTemplateKey = java.import("com.machinezoo.sourceafis.transparency.keys.ProbeTemplateKey");
    const CandidateTemplateKey = java.import("com.machinezoo.sourceafis.transparency.keys.CandidateTemplateKey");
    const buffer = new TransparencyBuffer();
    const transparency = buffer.openSync();
    let score = 0;
    try {
        const matcher = (0, sourceafis_1.createMatcher)(probeTemplate);
        score = (0, sourceafis_1.matchWithMatcher)(matcher, candidateTemplate);
    }
    finally {
        transparency.closeSync();
    }
    const archive = buffer.toArchiveSync();
    const pairingOpt = archive.deserializeSync(new BestPairingKey());
    if (!pairingOpt.isPresentSync()) {
        throw new Error("Transparency data missing best-pairing.");
    }
    const probeOpt = archive.deserializeSync(new ProbeTemplateKey());
    if (!probeOpt.isPresentSync()) {
        throw new Error("Transparency data missing probe template.");
    }
    const candidateOpt = archive.deserializeSync(new CandidateTemplateKey());
    if (!candidateOpt.isPresentSync()) {
        throw new Error("Transparency data missing candidate template.");
    }
    const pairing = pairingOpt.getSync();
    const pairs = extractPairs(pairing);
    const probePersistent = probeOpt.getSync();
    const candidatePersistent = candidateOpt.getSync();
    return {
        pairing,
        probeTemplate: persistentToTemplate(probePersistent),
        candidateTemplate: persistentToTemplate(candidatePersistent),
        score,
        pairs,
    };
}
function mosaicFromTemplates(probeTemplate, candidateTemplate, options = {}) {
    var _a, _b;
    const resolvedProbe = isByteArray(probeTemplate) ? (0, sourceafis_1.templateFromBytes)(probeTemplate) : probeTemplate;
    const resolvedCandidate = isByteArray(candidateTemplate)
        ? (0, sourceafis_1.templateFromBytes)(candidateTemplate)
        : candidateTemplate;
    const { probeTemplate: probe, candidateTemplate: candidate, score, pairs } = capturePairing(resolvedProbe, resolvedCandidate);
    const transform = computeTransform(pairs, probe, candidate);
    const mergeMatched = (_a = options.mergeMatched) !== null && _a !== void 0 ? _a : "probe";
    const includeUnmatched = (_b = options.includeUnmatched) !== null && _b !== void 0 ? _b : true;
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
        }
        else if (mergeMatched === "average") {
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
function mosaicFromImages(probeImage, candidateImage, imageOptions, options = {}) {
    const probeTemplate = (0, sourceafis_1.templateFromEncoded)(probeImage, imageOptions !== null && imageOptions !== void 0 ? imageOptions : {});
    const candidateTemplate = (0, sourceafis_1.templateFromEncoded)(candidateImage, imageOptions !== null && imageOptions !== void 0 ? imageOptions : {});
    return mosaicFromTemplates(probeTemplate, candidateTemplate, options);
}
function mosaicImages(probePng, candidatePng, transform, options = {}) {
    var _a;
    const { PNG } = require("pngjs");
    const probe = PNG.sync.read(Buffer.from(probePng));
    const candidate = PNG.sync.read(Buffer.from(candidatePng));
    const output = new PNG({ width: probe.width, height: probe.height });
    probe.data.copy(output.data);
    const alphaScale = Math.max(0, Math.min(1, (_a = options.alpha) !== null && _a !== void 0 ? _a : 1));
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
