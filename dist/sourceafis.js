"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const child_process_1 = require("child_process");
const pngjs_1 = require("pngjs");
const PROJECT_ROOT = path.resolve(__dirname, "..");
const ROOT_TARGET_DIR = path.join(PROJECT_ROOT, "target");
const CLASSPATH_FILE = path.join(ROOT_TARGET_DIR, "classpath.txt");
const NODE_WORKER_RESULT_MARKER = "__SOURCEAFIS_WORKER_RESULT__";
let javaModule = null;
function isBunRuntime() {
    return Boolean(process.versions.bun);
}
function cloneBytes(buffer) {
    return Buffer.from(buffer);
}
function isBuffer(value) {
    return Buffer.isBuffer(value);
}
function toBase64(buffer) {
    return Buffer.from(buffer).toString("base64");
}
function fromBase64(encoded) {
    return Buffer.from(encoded, "base64");
}
function parseWorkerResponse(stdout, stderr) {
    for (const stream of [stdout, stderr]) {
        const index = stream.lastIndexOf(NODE_WORKER_RESULT_MARKER);
        if (index < 0) {
            continue;
        }
        const json = stream.slice(index + NODE_WORKER_RESULT_MARKER.length).trim();
        if (!json) {
            continue;
        }
        return JSON.parse(json);
    }
    return null;
}
function isWorkerFailure(response) {
    return response.ok === false;
}
function runNodeWorker(request) {
    const nodeBinary = process.env.SOURCEAFIS_NODE_BIN || "node";
    const workerScript = path.join(__dirname, "sourceafis-node-worker.js");
    const child = (0, child_process_1.spawnSync)(nodeBinary, [workerScript], {
        input: JSON.stringify(request),
        encoding: "utf8",
        env: process.env,
    });
    const stdout = child.stdout || "";
    const stderr = child.stderr || "";
    const response = parseWorkerResponse(stdout, stderr);
    if (response) {
        if (isWorkerFailure(response)) {
            const details = response.error.stack ? `\n${response.error.stack}` : "";
            throw new Error(`Node bridge worker failed: ${response.error.message}${details}`);
        }
        return response.result;
    }
    if (child.error) {
        throw new Error(`Failed to start Node bridge process '${nodeBinary}'. Set SOURCEAFIS_NODE_BIN to your node path. ${child.error.message}`);
    }
    if (!response) {
        const output = [stdout, stderr].filter(Boolean).join("\n").trim();
        const suffix = output ? ` Worker output:\n${output}` : "";
        const code = child.status == null ? "unknown" : String(child.status);
        throw new Error(`Node bridge worker exited with code ${code} without a valid response.${suffix}`);
    }
    throw new Error("Unexpected Node bridge worker state.");
}
function rawToPngBuffer(width, height, rawBuffer) {
    const pixelCount = width * height;
    if (rawBuffer.length !== pixelCount) {
        throw new Error(`Invalid raw buffer length. Expected ${pixelCount} bytes for ${width}x${height}, got ${rawBuffer.length}.`);
    }
    const png = new pngjs_1.PNG({ width, height });
    for (let i = 0; i < pixelCount; i += 1) {
        const gray = rawBuffer[i];
        const offset = i * 4;
        png.data[offset] = gray;
        png.data[offset + 1] = gray;
        png.data[offset + 2] = gray;
        png.data[offset + 3] = 255;
    }
    return pngjs_1.PNG.sync.write(png);
}
function extractTemplateBytes(value, argumentName) {
    if (isBuffer(value)) {
        return cloneBytes(value);
    }
    throw new Error(`Bun mode requires ${argumentName} to be Buffer.`);
}
function parseWorkerTemplate(result, operation) {
    const templateBufferB64 = result.templateBufferB64;
    if (typeof templateBufferB64 !== "string") {
        throw new Error(`Node bridge worker returned invalid template payload for '${operation}'.`);
    }
    return fromBase64(templateBufferB64);
}
function parseWorkerScore(result, operation) {
    const score = result.score;
    if (typeof score !== "number" || !Number.isFinite(score)) {
        throw new Error(`Node bridge worker returned invalid score payload for '${operation}'.`);
    }
    return score;
}
function validateImageSize(width, height) {
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
        throw new Error("Invalid image size. Expected positive width and height.");
    }
}
function getJava() {
    if (isBunRuntime()) {
        throw new Error("Internal error: getJava() should not be called in Bun mode.");
    }
    if (!javaModule) {
        // Lazy-load to avoid native addon initialization at module import time.
        javaModule = require("java");
    }
    return javaModule;
}
function addClasspathEntry(entry) {
    if (!entry) {
        return;
    }
    const java = getJava();
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
function findJar(dir, prefix) {
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
function initClasspath() {
    if (process.env.SOURCEAFIS_CLASSPATH) {
        for (const entry of process.env.SOURCEAFIS_CLASSPATH.split(path.delimiter)) {
            addClasspathEntry(entry);
        }
    }
    loadClasspathFromFile();
    const jarOverride = process.env.SOURCEAFIS_JAR;
    if (jarOverride && !fs.existsSync(path.resolve(process.cwd(), jarOverride))) {
        throw new Error("Cannot find SOURCEAFIS_JAR override file.");
    }
    const jar = jarOverride || findJar(ROOT_TARGET_DIR, "sourceafis-")[0] || null;
    if (!jar) {
        throw new Error("SourceAFIS jar not found. Run npm run build or set SOURCEAFIS_JAR to override.");
    }
    addClasspathEntry(jar);
}
function bufferToJavaBytes(buffer) {
    const java = getJava();
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
    const java = getJava();
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
let classes = null;
function getClasses() {
    if (!classes) {
        classes = initClasses();
    }
    return classes;
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
    if (isBunRuntime()) {
        if (!isBuffer(imageBuffer)) {
            throw new Error("imageFromEncoded requires Buffer image buffer.");
        }
        return cloneBytes(imageBuffer);
    }
    const loaded = getClasses();
    const javaBytes = bufferToJavaBytes(imageBuffer);
    const imageOptions = buildImageOptions(options);
    if (imageOptions) {
        return new loaded.FingerprintImage(javaBytes, imageOptions);
    }
    return new loaded.FingerprintImage(javaBytes);
}
function imageFromRaw(width, height, rawBuffer, options) {
    validateImageSize(width, height);
    if (isBunRuntime()) {
        if (!isBuffer(rawBuffer)) {
            throw new Error("imageFromRaw requires Buffer raw buffer.");
        }
        return rawToPngBuffer(width, height, rawBuffer);
    }
    const loaded = getClasses();
    const javaBytes = bufferToJavaBytes(rawBuffer);
    const imageOptions = buildImageOptions(options);
    if (imageOptions) {
        return new loaded.FingerprintImage(width, height, javaBytes, imageOptions);
    }
    return new loaded.FingerprintImage(width, height, javaBytes);
}
function templateFromImage(imageOrBuffer, options = {}) {
    if (isBuffer(imageOrBuffer)) {
        if (isBunRuntime()) {
            return templateFromEncoded(imageOrBuffer, options);
        }
        return templateFromEncoded(imageOrBuffer, options);
    }
    if (isBunRuntime()) {
        throw new Error("Bun mode templateFromImage requires Buffer image buffer.");
    }
    const loaded = getClasses();
    return new loaded.FingerprintTemplate(imageOrBuffer);
}
function templateFromEncoded(imageBuffer, options = {}) {
    if (isBunRuntime()) {
        if (!isBuffer(imageBuffer)) {
            throw new Error("templateFromEncoded requires Buffer image buffer.");
        }
        const result = runNodeWorker({
            op: "templateFromEncoded",
            imageBufferB64: toBase64(imageBuffer),
            options,
        });
        return parseWorkerTemplate(result, "templateFromEncoded");
    }
    const image = imageFromEncoded(imageBuffer, options);
    const template = templateFromImage(image);
    return serializeTemplate(template);
}
function templateFromRaw(width, height, rawBuffer, options = {}) {
    validateImageSize(width, height);
    if (isBunRuntime()) {
        if (!isBuffer(rawBuffer)) {
            throw new Error("templateFromRaw requires Buffer raw buffer.");
        }
        const result = runNodeWorker({
            op: "templateFromRaw",
            width,
            height,
            rawBufferB64: toBase64(rawBuffer),
            options,
        });
        return parseWorkerTemplate(result, "templateFromRaw");
    }
    const image = imageFromRaw(width, height, rawBuffer, options);
    const template = templateFromImage(image);
    return serializeTemplate(template);
}
function serializeTemplate(template) {
    if (isBunRuntime()) {
        return extractTemplateBytes(template, "serializeTemplate argument");
    }
    const serialized = template.toByteArraySync();
    return javaBytesToBuffer(serialized);
}
function templateFromBytes(templateBuffer) {
    if (isBunRuntime()) {
        if (!isBuffer(templateBuffer)) {
            throw new Error("templateFromBytes requires Buffer template buffer.");
        }
        return cloneBytes(templateBuffer);
    }
    const loaded = getClasses();
    const templateBytes = bufferToJavaBytes(templateBuffer);
    return new loaded.FingerprintTemplate(templateBytes);
}
function importTemplate(templateBuffer) {
    if (isBunRuntime()) {
        if (!isBuffer(templateBuffer)) {
            throw new Error("importTemplate requires Buffer template buffer.");
        }
        const result = runNodeWorker({
            op: "importTemplateToBytes",
            templateBufferB64: toBase64(templateBuffer),
        });
        return parseWorkerTemplate(result, "importTemplateToBytes");
    }
    const loaded = getClasses();
    const bytes = bufferToJavaBytes(templateBuffer);
    return loaded.FingerprintCompatibility.importTemplateSync(bytes);
}
function createMatcher(templateOrBytes) {
    if (templateOrBytes == null) {
        throw new Error("createMatcher requires a FingerprintTemplate or serialized template bytes.");
    }
    if (isBunRuntime()) {
        return extractTemplateBytes(templateOrBytes, "createMatcher argument");
    }
    const loaded = getClasses();
    const template = isBuffer(templateOrBytes)
        ? templateFromBytes(templateOrBytes)
        : templateOrBytes;
    return new loaded.FingerprintMatcher(template);
}
function matchWithMatcher(matcher, candidateTemplateOrBytes) {
    if (candidateTemplateOrBytes == null) {
        throw new Error("matchWithMatcher requires a candidate template or serialized bytes.");
    }
    if (isBunRuntime()) {
        const probeTemplate = extractTemplateBytes(matcher, "matchWithMatcher matcher");
        const candidateTemplate = extractTemplateBytes(candidateTemplateOrBytes, "matchWithMatcher candidate");
        return matchTemplates(probeTemplate, candidateTemplate);
    }
    const candidate = isBuffer(candidateTemplateOrBytes)
        ? templateFromBytes(candidateTemplateOrBytes)
        : candidateTemplateOrBytes;
    return matcher.matchSync(candidate);
}
function matchTemplates(probeTemplate, candidateTemplate) {
    if (isBunRuntime()) {
        const probeBytes = extractTemplateBytes(probeTemplate, "matchTemplates probeTemplate");
        const candidateBytes = extractTemplateBytes(candidateTemplate, "matchTemplates candidateTemplate");
        const result = runNodeWorker({
            op: "matchTemplates",
            probeTemplateB64: toBase64(probeBytes),
            candidateTemplateB64: toBase64(candidateBytes),
        });
        return parseWorkerScore(result, "matchTemplates");
    }
    const probe = templateFromBytes(probeTemplate);
    const candidate = templateFromBytes(candidateTemplate);
    const matcher = createMatcher(probe);
    return matchWithMatcher(matcher, candidate);
}
function matchImages(probeImage, candidateImage, options = {}) {
    if (isBunRuntime()) {
        if (!isBuffer(probeImage) || !isBuffer(candidateImage)) {
            throw new Error("matchImages requires Buffer probe and candidate images.");
        }
        const result = runNodeWorker({
            op: "matchImages",
            probeImageB64: toBase64(probeImage),
            candidateImageB64: toBase64(candidateImage),
            options,
        });
        return parseWorkerScore(result, "matchImages");
    }
    const probeTemplate = templateFromEncoded(probeImage, options);
    const candidateTemplate = templateFromEncoded(candidateImage, options);
    return matchTemplates(probeTemplate, candidateTemplate);
}
