# SourceAFIS Java wrapper for Node.js

A thin Node.js wrapper around SourceAFIS for Java via `node-java`. It supports image decoding, raw grayscale input, DPI configuration, template import/export, 1:1 and 1:N matching

## Requirements

- Java 11+
- Maven (optional if you're using prebuilt jar)
- Node.js (required at runtime when using Bun)

## Bun runtime

When this package runs inside Bun, it automatically executes fingerprint operations in a Node subprocess.
If `node` is not on your PATH, set `SOURCEAFIS_NODE_BIN` to the Node binary path.
In Bun mode, image/template/matcher values are handled as `Buffer` values (no custom handle object).

## Build the SourceAFIS jar
