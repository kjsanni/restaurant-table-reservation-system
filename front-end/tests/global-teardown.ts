import { execSync } from "child_process";

export default async () => {
  const rootDir = new URL(".", import.meta.url).pathname.replace(/\/$/, "");
  const backendDir = `${rootDir}/../back-end`;

  try {
    execSync("npm run seed:undo", { cwd: backendDir, stdio: "inherit" });
  } catch (err) {
    console.warn("[playwright] E2E data teardown failed:", err.message);
  }
};
