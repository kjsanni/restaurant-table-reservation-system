import fs from "fs";
import path from "path";
import zlib from "zlib";

const SCRIPT_DIR = new URL(".", import.meta.url).pathname;
const DIST_DIR = path.resolve(SCRIPT_DIR, "dist");
const ASSETS_DIR = path.join(DIST_DIR, "assets");

function assertWithinDirectory(filePath, baseDir) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(baseDir)) {
    throw new Error(`Path escapes expected directory: ${filePath}`);
  }
  return resolved;
}

if (!fs.existsSync(ASSETS_DIR)) {
  console.error("Build assets directory not found. Run `npm run build` first.");
  process.exit(1);
}

const files = fs.readdirSync(ASSETS_DIR);
const jsFiles = files.filter((f) => f.endsWith(".js"));

let failed = false;
const limit = 300 * 1024;

for (const file of jsFiles) {
  const filePath = assertWithinDirectory(path.join(ASSETS_DIR, file), DIST_DIR);
  const buffer = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(buffer);
  const size = gzipped.length;

  const marker = size > limit ? "FAIL" : "PASS";
  console.log(
    `${marker} ${file}: ${(size / 1024).toFixed(2)} KB gzipped (limit ${limit / 1024} KB)`
  );

  if (size > limit) {
    failed = true;
  }
}

if (failed) {
  console.error("Bundle size limit exceeded.");
  process.exit(1);
}

console.log("All bundles within size limits.");
