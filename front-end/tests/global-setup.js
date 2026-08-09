const { execSync } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.resolve(rootDir, "..", "back-end");

module.exports = async () => {
  try {
    console.log("[playwright] Running migrations...");
    execSync("npm run migrate:up", { cwd: backendDir, stdio: "inherit" });
    console.log("[playwright] Seeding E2E data...");
    execSync("npm run seed:e2e", { cwd: backendDir, stdio: "inherit" });
    console.log("[playwright] E2E data setup complete");
  } catch (err) {
    console.warn("[playwright] E2E data setup failed:", err.message);
  }
};
