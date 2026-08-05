const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const escapeShellArg = (value) => {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  if (str.length === 0) {
    return '""';
  }
  return `'${str.replace(/'/g, "'\\''")}'`;
};

const runBackup = async (options = {}) => {
  const {
    type = "full",
    outputDir = path.join(os.tmpdir(), "backups"),
  } = options;

  const sanitizedType = String(type).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!sanitizedType) {
    throw { status: 400, message: "Invalid backup type" };
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${sanitizedType}-${timestamp}.sql`;
  const outputPath = path.join(outputDir, fileName);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const dbName = process.env.DB_NAME || "restaurant_reservation";
  const dbUser = process.env.DB_USER || "root";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || "3306";
  const dbPass = process.env.DB_PASSWORD || "";

  const env = { ...process.env };
  if (dbPass) env.MYSQL_PWD = dbPass;

  const command = `mysqldump -h ${escapeShellArg(dbHost)} -P ${escapeShellArg(dbPort)} -u ${escapeShellArg(dbUser)} ${escapeShellArg(dbName)} > ${escapeShellArg(outputPath)}`;

  return new Promise((resolve, reject) => {
    exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        return reject({ status: 500, message: `Backup failed: ${error.message}` });
      }
      const stats = fs.statSync(outputPath);
      resolve({
        path: outputPath,
        fileName,
        sizeBytes: stats.size,
        type,
      });
    });
  });
};

const runRestore = async (options = {}) => {
  const { filePath, dryRun = false } = options;

  if (!filePath || typeof filePath !== "string" || !filePath.trim()) {
    throw { status: 400, message: "Backup file path is required" };
  }

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

  const dbName = process.env.DB_NAME || "restaurant_reservation";
  const dbUser = process.env.DB_USER || "root";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || "3306";
  const dbPass = process.env.DB_PASSWORD || "";

  const env = { ...process.env };
  if (dbPass) env.MYSQL_PWD = dbPass;

  const command = `mysql -h ${escapeShellArg(dbHost)} -P ${escapeShellArg(dbPort)} -u ${escapeShellArg(dbUser)} ${escapeShellArg(dbName)} < ${escapeShellArg(resolvedPath)}`;

  return new Promise((resolve, reject) => {
    exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        return reject({ status: 500, message: `Restore failed: ${error.message}` });
      }
      resolve({ success: true, restoredAt: new Date().toISOString() });
    });
  });
};

module.exports = {
  runBackup,
  runRestore,
};
