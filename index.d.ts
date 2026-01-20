export interface ImageOptions {
  dpi?: number | null;
}

export interface CandidateRecord {
  id: number;
  name?: string;
  templateBytes: Uint8Array;
}

export function imageFromEncoded(image: Uint8Array, options?: ImageOptions): unknown;
export function imageFromRaw(
  width: number,
  height: number,
  raw: Uint8Array,
  options?: ImageOptions
): unknown;

export function templateFromImage(
  imageOrBuffer: unknown | Uint8Array,
  options?: ImageOptions
): unknown | Uint8Array;
export function templateFromEncoded(image: Uint8Array, options?: ImageOptions): Uint8Array;
export function templateFromRaw(
  width: number,
  height: number,
  raw: Uint8Array,
  options?: ImageOptions
): Uint8Array;

export function serializeTemplate(template: unknown): Uint8Array;
export function templateFromBytes(bytes: Uint8Array): unknown;
export function importTemplate(bytes: Uint8Array): unknown;

export function createMatcher(template: unknown): unknown;
export function matchWithMatcher(matcher: unknown, candidateTemplate: unknown): number;

export function withTransparencyZip(zipPath: string, fn: () => void): void;

export function matchTemplates(probeTemplate: Uint8Array, candidateTemplate: Uint8Array): number;
export function matchImages(
  probeImage: Uint8Array,
  candidateImage: Uint8Array,
  options?: ImageOptions
): number;
