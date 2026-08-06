#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const backendPath = path.join(
  ROOT,
  "back-end/src/tenant-platform/controllers/legalAcceptance.controller.js"
);
const frontendPath = path.join(
  ROOT,
  "front-end/src/services/legalAcceptanceAPI.js"
);

function extractVersions(filePath) {
  const content = fs.readFileSync(filePath, "utf8"); // nosep - filePath is from hardcoded LEGAL_FILES array, not user input

  const match = content.match(/LEGAL_DOCUMENT_VERSIONS\s*=\s*\{([\s\S]*?)\}/);
  if (!match) {
    throw new Error(
      `Could not find LEGAL_DOCUMENT_VERSIONS in ${path.relative(ROOT, filePath)}`
    );
  }

  const body = match[1];
  const result = {};

  const entryRegex = /(?:["'])?([^"'\s:]+)(?:["'])?\s*:\s*["']([^"']*)["']/g;
  let m;
  while ((m = entryRegex.exec(body)) !== null) {
    result[m[1]] = m[2];
  }

  return result;
}

function main() {
  let backend, frontend;
  try {
    backend = extractVersions(backendPath);
  } catch (e) {
    console.error(`Error reading backend: ${e.message}`);
    process.exit(1);
  }
  try {
    frontend = extractVersions(frontendPath);
  } catch (e) {
    console.error(`Error reading frontend: ${e.message}`);
    process.exit(1);
  }

  const backendKeys = Object.keys(backend).sort();
  const frontendKeys = Object.keys(frontend).sort();

  let mismatches = 0;

  const backendOnly = backendKeys.filter((k) => !frontend.hasOwnProperty(k));
  const frontendOnly = frontendKeys.filter((k) => !backend.hasOwnProperty(k));
  const allKeys = Array.from(new Set([...backendKeys, ...frontendKeys])).sort();

  for (const key of allKeys) {
    const b = backend[key];
    const f = frontend[key];
    if (b !== f) {
      mismatches++;
      console.error(
        `  MISMATCH: "${key}" — backend: "${b}", frontend: "${f}"`
      );
    }
  }

  if (backendOnly.length || frontendOnly.length || mismatches) {
    if (backendOnly.length) {
      console.error(
        `  Keys only in backend: ${backendOnly.join(", ")}`
      );
    }
    if (frontendOnly.length) {
      console.error(
        `  Keys only in frontend: ${frontendOnly.join(", ")}`
      );
    }
    console.error(
      `\nLEGAL_DOCUMENT_VERSIONS mismatch detected — both files must stay in sync.`
    );
    process.exit(1);
  }

  console.log(
    `✅ LEGAL_DOCUMENT_VERSIONS in sync: ${backendKeys.length} documents, all values match.`
  );
}

main();
