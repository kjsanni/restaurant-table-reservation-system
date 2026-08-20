import fs from "fs";
import path from "path";
import zlib from "zlib";

const distDir = path.resolve(new URL(".", import.meta.url).pathname, "../dist");
const assetsDir = path.join(distDir, "assets"); // codacy-suppress FileAccess - assetsDir derived from static import.meta.url path, not user input

if (!fs.existsSync(assetsDir)) {
  // codacy-suppress FileAccess - assetsDir derived from static import.meta.url path, not user input
  console.error("Build assets directory not found. Run `npm run build` first.");
  process.exit(1);
}

const files = fs.readdirSync(assetsDir); // codacy-suppress FileAccess - assetsDir derived from static import.meta.url path, not user input
const jsFiles = files.filter((f) => f.endsWith(".js"));

let failed = false;
const limit = 300 * 1024;

for (const file of jsFiles) {
  const filePath = path.join(assetsDir, file); // codacy-suppress FileAccess - filePath derived from assetsDir (static import.meta.url) and readdirSync of fixed directory
  const buffer = fs.readFileSync(filePath); // codacy-suppress FileAccess - filePath derived from assetsDir (static import.meta.url) and readdirSync of fixed directory
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
