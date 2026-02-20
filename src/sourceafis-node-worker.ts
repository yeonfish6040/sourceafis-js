import * as fs from "fs";
import {
  importTemplate,
  matchImages,
  matchTemplates,
  serializeTemplate,
  templateFromEncoded,
  templateFromRaw,
} from "./sourceafis";

type WorkerSuccess = {
  ok: true;
  result: unknown;
};

type WorkerFailure = {
  ok: false;
  error: {
    message: string;
    name?: string;
    stack?: string;
  };
};

type WorkerResponse = WorkerSuccess | WorkerFailure;

const NODE_WORKER_RESULT_MARKER = "__SOURCEAFIS_WORKER_RESULT__";

function readRequest(): unknown {
  const input = fs.readFileSync(0, "utf8").trim();
  if (!input) {
    throw new Error("Worker received empty request payload.");
  }
  return JSON.parse(input);
}

function decodeBytes(base64: unknown, argumentName: string): Buffer {
  if (typeof base64 !== "string" || base64.length === 0) {
    throw new Error(`Worker request '${argumentName}' must be a non-empty base64 string.`);
  }
  return Buffer.from(base64, "base64");
}

function encodeBytes(bytes: Buffer): string {
  return Buffer.from(bytes).toString("base64");
}

function ensureNumber(value: unknown, argumentName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Worker request '${argumentName}' must be a finite number.`);
  }
  return parsed;
}

function execute(request: unknown): unknown {
  if (!request || typeof request !== "object") {
    throw new Error("Worker request must be an object.");
  }

  const payload = request as Record<string, unknown>;
  const op = payload.op;
  if (typeof op !== "string") {
    throw new Error("Worker request 'op' must be a string.");
  }

  switch (op) {
    case "templateFromEncoded": {
      const imageBuffer = decodeBytes(payload.imageBufferB64, "imageBufferB64");
      const options = (payload.options || {}) as Record<string, unknown>;
      const template = templateFromEncoded(imageBuffer, options);
      return { templateBufferB64: encodeBytes(template) };
    }
    case "templateFromRaw": {
      const width = ensureNumber(payload.width, "width");
      const height = ensureNumber(payload.height, "height");
      const rawBuffer = decodeBytes(payload.rawBufferB64, "rawBufferB64");
      const options = (payload.options || {}) as Record<string, unknown>;
      const template = templateFromRaw(width, height, rawBuffer, options);
      return { templateBufferB64: encodeBytes(template) };
    }
    case "importTemplateToBytes": {
      const templateBuffer = decodeBytes(payload.templateBufferB64, "templateBufferB64");
      const imported = importTemplate(templateBuffer);
      const serialized = serializeTemplate(imported);
      return { templateBufferB64: encodeBytes(serialized) };
    }
    case "matchTemplates": {
      const probe = decodeBytes(payload.probeTemplateB64, "probeTemplateB64");
      const candidate = decodeBytes(payload.candidateTemplateB64, "candidateTemplateB64");
      return { score: matchTemplates(probe, candidate) };
    }
    case "matchImages": {
      const probeImage = decodeBytes(payload.probeImageB64, "probeImageB64");
      const candidateImage = decodeBytes(payload.candidateImageB64, "candidateImageB64");
      const options = (payload.options || {}) as Record<string, unknown>;
      return { score: matchImages(probeImage, candidateImage, options) };
    }
    default:
      throw new Error(`Unknown worker operation '${op}'.`);
  }
}

function serializeError(error: unknown): WorkerFailure["error"] {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  return { message: String(error) };
}

function writeResponseAndExit(response: WorkerResponse, exitCode: number): never {
  fs.writeSync(process.stdout.fd, `${NODE_WORKER_RESULT_MARKER}${JSON.stringify(response)}`);
  process.exit(exitCode);
}

try {
  const request = readRequest();
  const result = execute(request);
  writeResponseAndExit({ ok: true, result }, 0);
} catch (error) {
  writeResponseAndExit({ ok: false, error: serializeError(error) }, 1);
}
