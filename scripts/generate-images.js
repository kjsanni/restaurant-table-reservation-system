#!/usr/bin/env node

import fs from "fs";
import path from "path";
import manifest from "../images/manifest.json" assert { type: "json" };

const IMAGE_GEN_URL = process.env.IMAGE_GEN_URL || "https://api.openai.com/v1/images/generations";
const IMAGE_GEN_API_KEY = process.env.OPENAI_API_KEY;

if (!IMAGE_GEN_API_KEY) {
  console.warn("OPENAI_API_KEY not set — dry run mode (no images generated).");
  console.log("Assets that would be generated:");
  manifest.assets.forEach((a) => {
    console.log(`  [${a.priority}] ${a.id} -> ${a.path}`);
  });
  process.exit(0);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${IMAGE_GEN_API_KEY}`,
};

async function generateAsset(asset) {
  const res = await fetch(IMAGE_GEN_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt: asset.prompt,
      n: 1,
      size: asset.type === "logo" ? "512x512" : "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed for ${asset.id}: ${res.statusText}`);
  }

  const data = await res.json();
  const b64 = data.data[0].b64_json;
  const buffer = Buffer.from(b64, "base64");

  const basename = path.basename(asset.path);
  if (!/^[\w.-]+$/.test(basename)) {
    throw new Error(`Unsafe filename: ${asset.path}`);
  }
  const imagesDir = path.resolve(process.cwd(), "front-end/src/assets/images");
  const outPath = path.resolve(imagesDir, basename);
  if (!outPath.startsWith(imagesDir + path.sep)) {
    throw new Error(`Path traversal detected: ${asset.path}`);
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Generated ${asset.id} -> ${outPath}`);
}

async function main() {
  const priority = ["high", "medium", "low"];
  for (const prio of priority) {
    const batch = manifest.assets.filter((a) => a.priority === prio);
    for (const asset of batch) {
      try {
        await generateAsset(asset);
      } catch (e) {
        console.error(e.message);
      }
    }
  }
  console.log("Image generation pipeline complete.");
}

main();
