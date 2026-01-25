# SourceAFIS Java wrapper for Node.js

A thin Node.js wrapper around SourceAFIS for Java via `node-java`. It supports image decoding, raw grayscale input, DPI configuration, template import/export, 1:1 and 1:N matching, and algorithm transparency ZIP output.

## Requirements

- Java 11+
- Maven
- Node.js

## Build the SourceAFIS jar

From the repository root:

```bash
sdk use java 11
mvn -q -DskipTests -f sourceafis-java/pom.xml package
mvn -q -DincludeScope=runtime -f sourceafis-java/pom.xml dependency:build-classpath -Dmdep.outputFile=target/classpath.txt
```

Copy the built jar into the root `target` folder:

```bash
mkdir -p target
cp sourceafis-java/target/sourceafis-*.jar target/
cp sourceafis-java/target/classpath.txt target/
```

This creates `target/classpath.txt` in the project root. The wrapper will load it automatically.

## Install Node dependencies

```bash
npm install
```

## Build with npm

```bash
npm run build
```

This compiles TypeScript to `dist/`, builds SourceAFIS + Transparency jars, and merges their classpaths into `target/classpath.txt`.

## Configuration

You can override the classpath/jar with environment variables:

- `SOURCEAFIS_JAR`: full path to the SourceAFIS jar.
- `SOURCEAFIS_CLASSPATH`: extra classpath entries (path-delimited). These are merged with `classpath.txt`.

## Quick start

```js
const fs = require("fs");
const sourceafis = require("@yeonfish6040/sourceafis-js");

const probe = fs.readFileSync("probe.png");
const candidate = fs.readFileSync("candidate.png");

const score = sourceafis.matchImages(probe, candidate, { dpi: 500 });
console.log("score:", score);
```

## API

### Standard image formats

```js
const encoded = fs.readFileSync("fingerprint.png");
const image = sourceafis.imageFromEncoded(encoded, { dpi: 500 });
const template = sourceafis.templateFromImage(image);
const serialized = sourceafis.serializeTemplate(template);
```

`templateFromImage` returns a Java `FingerprintTemplate` object. Use `serializeTemplate` to get bytes. If you pass a `Buffer` to `templateFromImage`, it behaves like `templateFromEncoded`.

### Raw grayscale images

```js
const raw = fs.readFileSync("fingerprint.gray");
const width = 300;
const height = 400;
const image = sourceafis.imageFromRaw(width, height, raw, { dpi: 500 });
const template = sourceafis.templateFromImage(image);
```

### DPI configuration

```js
const encoded = fs.readFileSync("fingerprint.png");
const templateBytes = sourceafis.templateFromEncoded(encoded, { dpi: 500 });
```

Default DPI is 500. Pass `{ dpi: null }` to skip setting DPI.

### Foreign templates (ISO, ANSI)

```js
const foreign = fs.readFileSync("fingerprint.tmpl");
const template = sourceafis.importTemplate(foreign);
```

### Comparing two fingerprints (1:1)

```js
const probe = sourceafis.templateFromBytes(fs.readFileSync("probe.cbor"));
const candidate = sourceafis.templateFromBytes(fs.readFileSync("candidate.cbor"));
const matcher = sourceafis.createMatcher(probe);
const score = sourceafis.matchWithMatcher(matcher, candidate);
```

### 1:N matching (identification)

```js
const probe = sourceafis.templateFromBytes(fs.readFileSync("probe.cbor"));
const matcher = sourceafis.createMatcher(probe);
const candidates = loadCandidates(); // [{ id, name, templateBytes }]

let best = null;
let max = Number.NEGATIVE_INFINITY;

for (const candidate of candidates) {
  const template = sourceafis.templateFromBytes(candidate.templateBytes);
  const score = sourceafis.matchWithMatcher(matcher, template);
  if (score > max) {
    max = score;
    best = candidate;
  }
}

const threshold = 40;
const match = max >= threshold ? best : null;
```

### Persisting fingerprint templates

```js
const encoded = fs.readFileSync("fingerprint.png");
const templateBytes = sourceafis.templateFromEncoded(encoded);
fs.writeFileSync("fingerprint.cbor", templateBytes);

const restored = sourceafis.templateFromBytes(fs.readFileSync("fingerprint.cbor"));
```

### Algorithm transparency ZIP

```js
const probe = fs.readFileSync("probe.png");
const candidate = fs.readFileSync("candidate.png");

sourceafis.withTransparencyZip("transparency.zip", () => {
  const score = sourceafis.matchImages(probe, candidate, { dpi: 500 });
  console.log("score:", score);
});
```

`withTransparencyZip` expects synchronous work inside the callback.

### Minutiae mosaicking (pairing-based)

```js
const probe = fs.readFileSync("probe.png");
const candidate = fs.readFileSync("candidate.png");

const result = sourceafis.mosaicFromImages(probe, candidate, { dpi: 300 });
console.log("score:", result.score);
console.log("pairs:", result.pairs.length);

// result.template contains the merged minutiae list
// result.transform can be used to align images
```

### Image mosaicking (using transform)

```js
const probe = fs.readFileSync("probe.png");
const candidate = fs.readFileSync("candidate.png");

const result = sourceafis.mosaicFromImages(probe, candidate, { dpi: 300 });
const merged = sourceafis.mosaicImages(probe, candidate, result.transform, {
  alpha: 0.7,
  backgroundThreshold: 245,
});
fs.writeFileSync("mosaic.png", merged);
```

## Notes

- `FingerprintMatcher` creation is expensive. Reuse it for multiple candidate comparisons.
- Templates are tied to the SourceAFIS version. Keep original images for long-term storage.

## License

Apache-2.0
