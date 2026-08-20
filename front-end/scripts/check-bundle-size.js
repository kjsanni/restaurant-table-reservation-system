import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const DIST_DIR = path.resolve(SCRIPT_DIR, "dist");
const ASSETS_DIR = path.resolve(DIST_DIR, "assets");

if (!fs.existsSync(ASSETS_DIR)) {
  console.error("Build assets directory not found. Run `npm run build` first.");
  process.exit(1);
}

const files = fs.readdirSync(ASSETS_DIR);
const jsFiles = files.filter((f) => f.endsWith(".js"));

let failed = false;
const limit = 300 * 1024;

for (const file of jsFiles) {
  const filePath = path.resolve(ASSETS_DIR, file);
  if (!filePath.startsWith(DIST_DIR)) {
    console.error(`Skipping file outside expected directory: ${file}`);
    continue;
  }
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
