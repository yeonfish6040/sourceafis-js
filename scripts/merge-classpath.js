const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROOT_TARGET = path.join(ROOT, "target");
const SOURCEAFIS_CP = path.join(ROOT, "sourceafis-java", "target", "classpath.txt");
const TRANSPARENCY_CP = path.join(
  ROOT,
  "sourceafis-transparency-java",
  "target",
  "classpath.txt"
);
const OUTPUT = path.join(ROOT_TARGET, "classpath.txt");

function readEntries(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, "utf8").trim();
  if (!content) {
    return [];
  }
  return content.split(path.delimiter).filter(Boolean);
}

fs.mkdirSync(ROOT_TARGET, { recursive: true });

const entries = new Set();
for (const entry of readEntries(SOURCEAFIS_CP)) {
  entries.add(entry);
}
for (const entry of readEntries(TRANSPARENCY_CP)) {
  entries.add(entry);
}

const merged = Array.from(entries).join(path.delimiter);
fs.writeFileSync(OUTPUT, merged + (merged ? "\n" : ""));

console.log(`Merged classpath into ${OUTPUT}`);
