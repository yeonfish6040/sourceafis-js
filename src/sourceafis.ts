import * as fs from "fs";
import * as path from "path";
import * as java from "java";

export interface ImageOptions {
  dpi?: number | null;
}

export type SourceAfisClasses = {
  FingerprintImageOptions: any;
  FingerprintImage: any;
  FingerprintTemplate: any;
  FingerprintMatcher: any;
  FingerprintCompatibility: any;
  FileOutputStream: any;
};

const PROJECT_ROOT = path.resolve(__dirname, "..");
const ROOT_TARGET_DIR = path.join(PROJECT_ROOT, "target");
const CLASSPATH_FILE = path.join(ROOT_TARGET_DIR, "classpath.txt");

function addClasspathEntry(entry?: string | null): void {
  if (!entry) {
    return;
  }
  java.classpath.push(entry);
}

function loadClasspathFromFile(): void {
  if (!fs.existsSync(CLASSPATH_FILE)) {
    return;
  }
  const content = fs.readFileSync(CLASSPATH_FILE, "utf8").trim();
  if (!content) {
    return;
  }
  for (const entry of content.split(path.delimiter)) {
    if (entry) {
      addClasspathEntry(entry);
    }
  }
}

function findJar(dir: string, prefix: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const candidates = fs
    .readdirSync(dir)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".jar"))
    .map((name) => path.join(dir, name));
  if (candidates.length === 0) {
    return [];
  }
  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return candidates;
}

function initClasspath(): void {
  if (process.env.SOURCEAFIS_CLASSPATH) {
    for (const entry of process.env.SOURCEAFIS_CLASSPATH.split(path.delimiter)) {
      addClasspathEntry(entry);
    }
  }
  loadClasspathFromFile();

  const jarOverride = process.env.SOURCEAFIS_JAR;
  // check if override file exists
  if (jarOverride && !fs.existsSync(path.resolve(process.cwd(), jarOverride))){
    throw new Error("Cannot find SOURCEAFIS_JAR override file.")
  }

  const jar = jarOverride || findJar(ROOT_TARGET_DIR, "sourceafis-")[0] || null;
  if (!jar) {
    throw new Error("SourceAFIS jar not found. Run npm run build or set SOURCEAFIS_JAR to override.");
  }

  addClasspathEntry(jar);
}

function bufferToJavaBytes(buffer: Uint8Array): any {
  const bytes = new Array(buffer.length);
  for (let i = 0; i < buffer.length; i += 1) {
    const value = buffer[i];
    bytes[i] = value > 127 ? value - 256 : value;
  }
  return java.newArray("byte", bytes);
}

function javaBytesToBuffer(bytes: number[]): Buffer {
  const out = Buffer.alloc(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = bytes[i] & 0xff;
  }
  return out;
}

function initClasses(): SourceAfisClasses {
  initClasspath();
  return {
    FingerprintImageOptions: java.import("com.machinezoo.sourceafis.FingerprintImageOptions"),
    FingerprintImage: java.import("com.machinezoo.sourceafis.FingerprintImage"),
    FingerprintTemplate: java.import("com.machinezoo.sourceafis.FingerprintTemplate"),
    FingerprintMatcher: java.import("com.machinezoo.sourceafis.FingerprintMatcher"),
    FingerprintCompatibility: java.import("com.machinezoo.sourceafis.FingerprintCompatibility"),
    FileOutputStream: java.import("java.io.FileOutputStream"),
  };
}

let classes: SourceAfisClasses | null = null;

function getClasses(): SourceAfisClasses {
  if (!classes) {
    classes = initClasses();
  }
  return classes;
}

function isByteArray(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}

function resolveDpi(options?: ImageOptions | null): number | null {
  if (!options || options.dpi === undefined) {
    return 500;
  }
  if (options.dpi === null) {
    return null;
  }
  const dpi = Number(options.dpi);
  if (!Number.isFinite(dpi) || dpi <= 0) {
    throw new Error("Invalid dpi. Expected a positive number.");
  }
  return dpi;
}

function buildImageOptions(options?: ImageOptions | null): any {
  const dpi = resolveDpi(options);
  if (dpi == null) {
    return null;
  }
  const loaded = getClasses();
  const imageOptions = new loaded.FingerprintImageOptions();
  imageOptions.dpiSync(dpi);
  return imageOptions;
}

export function imageFromEncoded(imageBuffer: Uint8Array, options?: ImageOptions): any {
  const loaded = getClasses();
  const javaBytes = bufferToJavaBytes(imageBuffer);
  const imageOptions = buildImageOptions(options);
  if (imageOptions) {
    return new loaded.FingerprintImage(javaBytes, imageOptions);
  }
  return new loaded.FingerprintImage(javaBytes);
}

export function imageFromRaw(
  width: number,
  height: number,
  rawBuffer: Uint8Array,
  options?: ImageOptions
): any {
  const loaded = getClasses();
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error("Invalid image size. Expected positive width and height.");
  }
  const javaBytes = bufferToJavaBytes(rawBuffer);
  const imageOptions = buildImageOptions(options);
  if (imageOptions) {
    return new loaded.FingerprintImage(width, height, javaBytes, imageOptions);
  }
  return new loaded.FingerprintImage(width, height, javaBytes);
}

export function templateFromImage(
  imageOrBuffer: unknown | Uint8Array,
  options: ImageOptions = {}
): any | Uint8Array {
  if (isByteArray(imageOrBuffer)) {
    return templateFromEncoded(imageOrBuffer, options);
  }
  const loaded = getClasses();
  return new loaded.FingerprintTemplate(imageOrBuffer);
}

export function templateFromEncoded(
  imageBuffer: Uint8Array,
  options: ImageOptions = {}
): Uint8Array {
  const image = imageFromEncoded(imageBuffer, options);
  const template = templateFromImage(image);
  return serializeTemplate(template);
}

export function templateFromRaw(
  width: number,
  height: number,
  rawBuffer: Uint8Array,
  options: ImageOptions = {}
): Uint8Array {
  const image = imageFromRaw(width, height, rawBuffer, options);
  const template = templateFromImage(image);
  return serializeTemplate(template);
}

export function serializeTemplate(template: any): Uint8Array {
  const serialized = template.toByteArraySync();
  return javaBytesToBuffer(serialized);
}

export function templateFromBytes(templateBuffer: Uint8Array): any {
  const loaded = getClasses();
  const templateBytes = bufferToJavaBytes(templateBuffer);
  return new loaded.FingerprintTemplate(templateBytes);
}

export function importTemplate(templateBuffer: Uint8Array): any {
  const loaded = getClasses();
  const bytes = bufferToJavaBytes(templateBuffer);
  return loaded.FingerprintCompatibility.importTemplateSync(bytes);
}

export function createMatcher(templateOrBytes: unknown | Uint8Array): any {
  const loaded = getClasses();
  if (templateOrBytes == null) {
    throw new Error("createMatcher requires a FingerprintTemplate or serialized template bytes.");
  }
  const template = isByteArray(templateOrBytes)
    ? templateFromBytes(templateOrBytes)
    : templateOrBytes;
  return new loaded.FingerprintMatcher(template);
}

export function matchWithMatcher(
  matcher: any,
  candidateTemplateOrBytes: unknown | Uint8Array
): number {
  if (candidateTemplateOrBytes == null) {
    throw new Error("matchWithMatcher requires a candidate template or serialized bytes.");
  }
  const candidate = isByteArray(candidateTemplateOrBytes)
    ? templateFromBytes(candidateTemplateOrBytes)
    : candidateTemplateOrBytes;
  return matcher.matchSync(candidate);
}

export function matchTemplates(probeTemplate: Uint8Array, candidateTemplate: Uint8Array): number {
  const probe = templateFromBytes(probeTemplate);
  const candidate = templateFromBytes(candidateTemplate);
  const matcher = createMatcher(probe);
  return matchWithMatcher(matcher, candidate);
}

export function matchImages(
  probeImage: Uint8Array,
  candidateImage: Uint8Array,
  options: ImageOptions = {}
): number {
  const probeTemplate = templateFromEncoded(probeImage, options);
  const candidateTemplate = templateFromEncoded(candidateImage, options);
  return matchTemplates(probeTemplate, candidateTemplate);
}
