"use strict";

const fs = require("fs");
const path = require("path");

const SecurityReview = {
  async checkHardcodedSecrets() {
    const srcDir = path.join(process.cwd(), "back-end", "src");
    const issues = [];

    const secretPatterns = [
      { pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/i, severity: "high", description: "Hardcoded password" },
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{16,}['"]/i, severity: "high", description: "Hardcoded API key" },
      { pattern: /secret\s*[:=]\s*['"][^'"]{16,}['"]/i, severity: "high", description: "Hardcoded secret" },
      { pattern: /token\s*[:=]\s*['"][^'"]{32,}['"]/i, severity: "medium", description: "Hardcoded token" },
    ];

    const walkDir = (dir) => {
      // codacy-suppress javascript.lang.security.audit.injection.path-traversal dir is from filesystem enumeration of a fixed source tree
      const files = fs.readdirSync(dir); // codacy-suppress javascript.lang.security.audit.injection.path-traversal readdirSync of a fixed source tree
      for (const file of files) {
        // codacy-suppress javascript.lang.security.audit.injection.path-traversal filePath is built from readdirSync of a fixed source tree
        const filePath = path.join(dir, file); // codacy-suppress javascript.lang.security.audit.injection.path-traversal path.join from readdirSync of fixed source tree
        const stat = fs.statSync(filePath); // codacy-suppress javascript.lang.security.audit.injection.path-traversal statSync of path from readdirSync
        if (stat.isDirectory() && !filePath.includes("node_modules") && !filePath.includes("__tests__")) {
          walkDir(filePath);
        } else if (file.endsWith(".js") || file.endsWith(".ts") || file.endsWith(".json")) {
          try {
            // codacy-suppress javascript.lang.security.audit.injection.path-traversal filePath is from filesystem enumeration
            // codacy-suppress javascript.lang.security.audit.injection.race-condition filePath is from readdirSync of a fixed source tree, not attacker-controlled input
            const content = fs.readFileSync(filePath, "utf8"); // codacy-suppress javascript.lang.security.audit.injection.path-traversal readFileSync of path from readdirSync
            for (const { pattern, severity, description } of secretPatterns) {
              if (pattern.test(content)) {
                issues.push({ file: filePath.replace(process.cwd() + "/", ""), severity, description });
              }
            }
          } catch {
            // skip binary files
          }
        }
      }
    };

    walkDir(srcDir);
    return issues;
  },

  async checkSqlInjectionPatterns() {
    const srcDir = path.join(process.cwd(), "back-end", "src");
    const issues = [];

    const walkDir = (dir) => {
      // codacy-suppress javascript.lang.security.audit.injection.path-traversal dir is from filesystem enumeration of a fixed source tree
      const files = fs.readdirSync(dir); // codacy-suppress javascript.lang.security.audit.injection.path-traversal readdirSync of a fixed source tree
      for (const file of files) {
        // codacy-suppress javascript.lang.security.audit.injection.path-traversal filePath is built from readdirSync of a fixed source tree
        const filePath = path.join(dir, file); // codacy-suppress javascript.lang.security.audit.injection.path-traversal path.join from readdirSync of fixed source tree
        const stat = fs.statSync(filePath); // codacy-suppress javascript.lang.security.audit.injection.path-traversal statSync of path from readdirSync
        if (stat.isDirectory() && !filePath.includes("node_modules") && !filePath.includes("__tests__")) {
          walkDir(filePath);
        } else if (file.endsWith(".js")) {
          try {
            // codacy-suppress javascript.lang.security.audit.injection.path-traversal filePath is from filesystem enumeration
            // codacy-suppress javascript.lang.security.audit.injection.race-condition filePath is from readdirSync of a fixed source tree, not attacker-controlled input
            const content = fs.readFileSync(filePath, "utf8"); // codacy-suppress javascript.lang.security.audit.injection.path-traversal readFileSync of path from readdirSync
            if (content.includes(" sequelize.query(") && !content.includes("replacements:") && !content.includes("Op.")) {
              issues.push({ file: filePath.replace(process.cwd() + "/", ""), severity: "high", description: "Potential SQL injection: raw query without parameters" });
            }
          } catch {
            // skip
          }
        }
      }
    };

    walkDir(srcDir);
    return issues;
  },

  async checkAuthCoverage() {
    const srcDir = path.join(process.cwd(), "back-end", "src");
    const issues = [];

    const walkDir = (dir) => {
      // codacy-suppress javascript.lang.security.audit.injection.path-traversal dir is from filesystem enumeration of a fixed source tree
      const files = fs.readdirSync(dir); // codacy-suppress javascript.lang.security.audit.injection.path-traversal readdirSync of a fixed source tree
      for (const file of files) {
        // codacy-suppress javascript.lang.security.audit.injection.path-traversal filePath is built from readdirSync of a fixed source tree
        const filePath = path.join(dir, file); // codacy-suppress javascript.lang.security.audit.injection.path-traversal path.join from readdirSync of fixed source tree
        const stat = fs.statSync(filePath); // codacy-suppress javascript.lang.security.audit.injection.path-traversal statSync of path from readdirSync
        if (stat.isDirectory() && !filePath.includes("node_modules") && !filePath.includes("__tests__")) {
          walkDir(filePath);
        } else if (file.endsWith(".router.js")) {
          try {
            // codacy-suppress javascript.lang.security.audit.injection.path-traversal filePath is from filesystem enumeration
            // codacy-suppress javascript.lang.security.audit.injection.race-condition filePath is from readdirSync of a fixed source tree, not attacker-controlled input
            const content = fs.readFileSync(filePath, "utf8"); // codacy-suppress javascript.lang.security.audit.injection.path-traversal readFileSync of path from readdirSync
            if (content.includes("router.route(") && !content.includes("protect") && !content.includes("requireSuperAdmin")) {
              issues.push({ file: filePath.replace(process.cwd() + "/", ""), severity: "medium", description: "Router may lack authentication middleware" });
            }
          } catch {
            // skip
          }
        }
      }
    };

    walkDir(srcDir);
    return issues;
  },

  async runFullReview() {
    const hardcodedSecrets = await this.checkHardcodedSecrets();
    const sqlInjection = await this.checkSqlInjectionPatterns();
    const authCoverage = await this.checkAuthCoverage();

    return {
      summary: {
        totalIssues: hardcodedSecrets.length + sqlInjection.length + authCoverage.length,
        high: hardcodedSecrets.filter((i) => i.severity === "high").length + sqlInjection.filter((i) => i.severity === "high").length,
        medium: hardcodedSecrets.filter((i) => i.severity === "medium").length + authCoverage.filter((i) => i.severity === "medium").length,
      },
      issues: {
        hardcodedSecrets,
        sqlInjection,
        authCoverage,
      },
    };
  },
};

module.exports = SecurityReview;
