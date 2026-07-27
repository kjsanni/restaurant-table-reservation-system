const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const runBackup = async (options = {}) => {
  const {
    type = "full",
    outputDir = path.join(os.tmpdir(), "backups"),
  } = options;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${type}-${timestamp}.sql`;
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

  const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} ${dbName} > "${outputPath}"`;

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

  if (!fs.existsSync(filePath)) {
    throw { status: 404, message: "Backup file not found" };
  }

  if (dryRun) {
    const content = fs.readFileSync(filePath, "utf8");
    const statements = content.split(";").filter((s) => s.trim().length > 0);
    return {
      dryRun: true,
      statementCount: statements.length,
      sizeBytes: fs.statSync(filePath).size,
    };
  }

  const dbName = process.env.DB_NAME || "restaurant_reservation";
  const dbUser = process.env.DB_USER || "root";
  const dbHost = process.env.DB_HOST || "localhost";
  const dbPort = process.env.DB_PORT || "3306";
  const dbPass = process.env.DB_PASSWORD || "";

  const env = { ...process.env };
  if (dbPass) env.MYSQL_PWD = dbPass;

  const command = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} ${dbName} < "${filePath}"`;

  return new Promise((resolve, reject) => {
    exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        return reject({ status: 500, message: `Restore failed: ${error.message}` });
      }
      resolve({ success: true, restoredAt: new Date() });
    });
  });
};

module.exports = {
  runBackup,
  runRestore,
};
