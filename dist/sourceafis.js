"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._getClasses = _getClasses;
exports.imageFromEncoded = imageFromEncoded;
exports.imageFromRaw = imageFromRaw;
exports.templateFromImage = templateFromImage;
exports.templateFromEncoded = templateFromEncoded;
exports.templateFromRaw = templateFromRaw;
exports.serializeTemplate = serializeTemplate;
exports.templateFromBytes = templateFromBytes;
exports.importTemplate = importTemplate;
exports.createMatcher = createMatcher;
exports.matchWithMatcher = matchWithMatcher;
exports.matchTemplates = matchTemplates;
exports.matchImages = matchImages;
const fs = require("fs");
const path = require("path");
const java = require("java");
const PROJECT_ROOT = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(PROJECT_ROOT, "sourceafis-java");
const TARGET_DIR = path.join(ROOT_DIR, "target");
const ROOT_TARGET_DIR = path.join(PROJECT_ROOT, "target");
const CLASSPATH_FILE = path.join(ROOT_TARGET_DIR, "classpath.txt");
function addClasspathEntry(entry) {
    if (!entry) {
        return;
    }
    java.classpath.push(entry);
}
function loadClasspathFromFile() {
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
function findJarInDir(dir, prefix) {
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
function findBuiltJar() {
    const rootCandidates = findJarInDir(ROOT_TARGET_DIR, "sourceafis-");
    if (rootCandidates.length > 0) {
        return rootCandidates[0];
    }
    return findJarInDir(TARGET_DIR, "sourceafis-")[0] || null;
}
function findTransparencyJar() {
    const rootCandidates = findJarInDir(ROOT_TARGET_DIR, "sourceafis-transparency-");
    if (rootCandidates.length > 0) {
        return rootCandidates[0];
    }
    const transparencyTarget = path.resolve(PROJECT_ROOT, "sourceafis-transparency-java", "target");
    return findJarInDir(transparencyTarget, "sourceafis-transparency-")[0] || null;
}
function initClasspath() {
    if (process.env.SOURCEAFIS_CLASSPATH) {
        for (const entry of process.env.SOURCEAFIS_CLASSPATH.split(path.delimiter)) {
            addClasspathEntry(entry);
        }
    }
    loadClasspathFromFile();
    const jarOverride = process.env.SOURCEAFIS_JAR;
    const jar = jarOverride || findBuiltJar();
    if (!jar) {
        throw new Error("SourceAFIS jar not found. Run npm run build or set SOURCEAFIS_JAR.");
    }
    addClasspathEntry(jar);
    const transparencyJar = findTransparencyJar();
    if (transparencyJar) {
        addClasspathEntry(transparencyJar);
    }
}
function bufferToJavaBytes(buffer) {
    const bytes = new Array(buffer.length);
    for (let i = 0; i < buffer.length; i += 1) {
        const value = buffer[i];
        bytes[i] = value > 127 ? value - 256 : value;
    }
    return java.newArray("byte", bytes);
}
function javaBytesToBuffer(bytes) {
    const out = Buffer.alloc(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) {
        out[i] = bytes[i] & 0xff;
    }
    return out;
}
function initClasses() {
    initClasspath();
    return {
        FingerprintImageOptions: java.import("com.machinezoo.sourceafis.FingerprintImageOptions"),
        FingerprintImage: java.import("com.machinezoo.sourceafis.FingerprintImage"),
        FingerprintTemplate: java.import("com.machinezoo.sourceafis.FingerprintTemplate"),
        FingerprintMatcher: java.import("com.machinezoo.sourceafis.FingerprintMatcher"),
        FingerprintCompatibility: java.import("com.machinezoo.sourceafis.FingerprintCompatibility"),
        FingerprintTransparency: java.import("com.machinezoo.sourceafis.FingerprintTransparency"),
        FileOutputStream: java.import("java.io.FileOutputStream"),
    };
}
let classes = null;
function getClasses() {
    if (!classes) {
        classes = initClasses();
    }
    return classes;
}
function _getClasses() {
    return getClasses();
}
function isByteArray(value) {
    return value instanceof Uint8Array;
}
function resolveDpi(options) {
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
function buildImageOptions(options) {
    const dpi = resolveDpi(options);
    if (dpi == null) {
        return null;
    }
    const loaded = getClasses();
    const imageOptions = new loaded.FingerprintImageOptions();
    imageOptions.dpiSync(dpi);
    return imageOptions;
}
function imageFromEncoded(imageBuffer, options) {
    const loaded = getClasses();
    const javaBytes = bufferToJavaBytes(imageBuffer);
    const imageOptions = buildImageOptions(options);
    if (imageOptions) {
        return new loaded.FingerprintImage(javaBytes, imageOptions);
    }
    return new loaded.FingerprintImage(javaBytes);
}
function imageFromRaw(width, height, rawBuffer, options) {
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
function templateFromImage(imageOrBuffer, options = {}) {
    if (isByteArray(imageOrBuffer)) {
        return templateFromEncoded(imageOrBuffer, options);
    }
    const loaded = getClasses();
    return new loaded.FingerprintTemplate(imageOrBuffer);
}
function templateFromEncoded(imageBuffer, options = {}) {
    const image = imageFromEncoded(imageBuffer, options);
    const template = templateFromImage(image);
    return serializeTemplate(template);
}
function templateFromRaw(width, height, rawBuffer, options = {}) {
    const image = imageFromRaw(width, height, rawBuffer, options);
    const template = templateFromImage(image);
    return serializeTemplate(template);
}
function serializeTemplate(template) {
    const serialized = template.toByteArraySync();
    return javaBytesToBuffer(serialized);
}
function templateFromBytes(templateBuffer) {
    const loaded = getClasses();
    const templateBytes = bufferToJavaBytes(templateBuffer);
    return new loaded.FingerprintTemplate(templateBytes);
}
function importTemplate(templateBuffer) {
    const loaded = getClasses();
    const bytes = bufferToJavaBytes(templateBuffer);
    return loaded.FingerprintCompatibility.importTemplateSync(bytes);
}
function createMatcher(templateOrBytes) {
    const loaded = getClasses();
    if (templateOrBytes == null) {
        throw new Error("createMatcher requires a FingerprintTemplate or serialized template bytes.");
    }
    const template = isByteArray(templateOrBytes)
        ? templateFromBytes(templateOrBytes)
        : templateOrBytes;
    return new loaded.FingerprintMatcher(template);
}
function matchWithMatcher(matcher, candidateTemplateOrBytes) {
    if (candidateTemplateOrBytes == null) {
        throw new Error("matchWithMatcher requires a candidate template or serialized bytes.");
    }
    const candidate = isByteArray(candidateTemplateOrBytes)
        ? templateFromBytes(candidateTemplateOrBytes)
        : candidateTemplateOrBytes;
    return matcher.matchSync(candidate);
}
function matchTemplates(probeTemplate, candidateTemplate) {
    const probe = templateFromBytes(probeTemplate);
    const candidate = templateFromBytes(candidateTemplate);
    const matcher = createMatcher(probe);
    return matchWithMatcher(matcher, candidate);
}
function matchImages(probeImage, candidateImage, options = {}) {
    const probeTemplate = templateFromEncoded(probeImage, options);
    const candidateTemplate = templateFromEncoded(candidateImage, options);
    return matchTemplates(probeTemplate, candidateTemplate);
}
