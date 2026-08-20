import fs from "fs";
import path from "path";
import zlib from "zlib";

const distDir = path.resolve(new URL(".", import.meta.url).pathname, "../dist");
const assetsDir = path.join(distDir, "assets");

if (!fs.existsSync(assetsDir)) {
  // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - assetsDir derived from static import.meta.url path
  console.error("Build assets directory not found. Run `npm run build` first.");
  process.exit(1);
}

const files = fs.readdirSync(assetsDir); // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - assetsDir derived from static import.meta.url path
const jsFiles = files.filter((f) => f.endsWith(".js"));

let failed = false;
const limit = 300 * 1024;

for (const file of jsFiles) {
  const filePath = path.join(assetsDir, file); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - assetsDir from static import.meta.url; file from readdirSync of fixed directory
  const buffer = fs.readFileSync(filePath); // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - filePath derived from assetsDir (static import.meta.url) and readdirSync of fixed directory
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
