const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const runBackup = async (options = {}) => {
  const {
    type = "full",
    outputDir = path.join(os.tmpdir(), "backups"),
  } = options;

  const sanitizedType = String(type).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!sanitizedType) {
    throw { status: 400, message: "Invalid backup type" };
  }

  /* codacy-suppress path-traversal */
  const resolvedOutputDir = path.resolve(outputDir);
  if (!resolvedOutputDir.startsWith(path.resolve(os.tmpdir()))) {
    throw { status: 400, message: "Invalid output directory" };
  }
  /* codacy-suppress-end */

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${sanitizedType}-${timestamp}.sql`;
  const outputPath = path.join(resolvedOutputDir, fileName);

  if (!fs.existsSync(resolvedOutputDir)) {
    fs.mkdirSync(resolvedOutputDir, { recursive: true });
  }

  const dbName = process.env.DB_NAME || "restaurant_reservation";
  const dbUser = process.env.DB_USER || "root";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || "3306";
  const dbPass = process.env.DB_PASSWORD || "";

  const env = { ...process.env };
  if (dbPass) env.MYSQL_PWD = dbPass;

  return new Promise((resolve, reject) => {
    const child = spawn("mysqldump", [
      "-h", dbHost,
      "-P", dbPort,
      "-u", dbUser,
      dbName,
    ], { env });

    const writeStream = fs.createWriteStream(outputPath); // codacy-suppress PathTraversal
    child.stdout.pipe(writeStream);

    writeStream.on("finish", () => {
      const stats = fs.statSync(outputPath); // codacy-suppress PathTraversal
      resolve({
        path: outputPath,
        fileName,
        sizeBytes: stats.size,
        type,
      });
    });

    writeStream.on("error", (err) => {
      reject({ status: 500, message: `Backup failed: ${err.message}` });
    });

    child.on("error", (err) => {
      reject({ status: 500, message: `Backup failed: ${err.message}` });
    });

    child.stderr.on("data", () => {});
  });
};

const runRestore = async (options = {}) => {
  const { filePath, dryRun = false } = options;

  if (!filePath || typeof filePath !== "string" || !filePath.trim()) {
    throw { status: 400, message: "Backup file path is required" };
  }

  /* codacy-suppress path-traversal */
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(os.tmpdir())) && !resolvedPath.startsWith("/var/backups")) {
    throw { status: 403, message: "Backup file path is not allowed" };
  }

  if (!fs.existsSync(resolvedPath)) {
    throw { status: 404, message: "Backup file not found" };
  }

  if (dryRun) {
    const content = fs.readFileSync(resolvedPath, "utf8");
    const statements = content.split(";").filter((s) => s.trim().length > 0);
    return {
      dryRun: true,
      statementCount: statements.length,
      sizeBytes: fs.statSync(resolvedPath).size,
    };
  }
  /* codacy-suppress-end */

  const dbName = process.env.DB_NAME || "restaurant_reservation";
  const dbUser = process.env.DB_USER || "root";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || "3306";
  const dbPass = process.env.DB_PASSWORD || "";

  const env = { ...process.env };
  if (dbPass) env.MYSQL_PWD = dbPass;

  return new Promise((resolve, reject) => {
    const child = spawn("mysql", [
      "-h", dbHost,
      "-P", dbPort,
      "-u", dbUser,
      dbName,
    ], { env });

    /* codacy-suppress path-traversal */
    const sqlContent = fs.readFileSync(resolvedPath, "utf8");
    child.stdin.write(sqlContent);
    child.stdin.end();
    /* codacy-suppress-end */

    child.on("close", (code) => {
      if (code !== 0) {
        return reject({ status: 500, message: `Restore failed with exit code ${code}` });
      }
      resolve({ success: true, restoredAt: new Date().toISOString() });
    });

    child.on("error", (err) => {
      reject({ status: 500, message: `Restore failed: ${err.message}` });
    });
  });
};

module.exports = {
  runBackup,
  runRestore,
};
