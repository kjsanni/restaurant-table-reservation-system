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
      const files = fs.readdirSync(dir, { withFileTypes: true }); // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - intentionally walks fixed source tree from process.cwd()
      for (const file of files) {
        const fullPath = path.join(dir, file.name); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - filePath from readdirSync of fixed source tree
        if (file.isDirectory() && !fullPath.includes("node_modules") && !fullPath.includes("__tests__")) {
          walkDir(fullPath);
        } else if ((file.name.endsWith(".js") || file.name.endsWith(".ts") || file.name.endsWith(".json")) && file.isFile()) {
          try {
            const content = fs.readFileSync(fullPath, "utf8");
            for (const { pattern, severity, description } of secretPatterns) {
              if (pattern.test(content)) {
                issues.push({ file: fullPath.replace(process.cwd() + "/", ""), severity, description });
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
      const files = fs.readdirSync(dir, { withFileTypes: true }); // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - intentionally walks fixed source tree from process.cwd()
      for (const file of files) {
        const fullPath = path.join(dir, file.name); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - path.join from readdirSync of fixed source tree
        if (file.isDirectory() && !fullPath.includes("node_modules") && !fullPath.includes("__tests__")) {
          walkDir(fullPath);
        } else if (file.name.endsWith(".js") && file.isFile()) {
          try {
            const content = fs.readFileSync(fullPath, "utf8");
            if (content.includes(" sequelize.query(") && !content.includes("replacements:") && !content.includes("Op.")) {
              issues.push({ file: fullPath.replace(process.cwd() + "/", ""), severity: "high", description: "Potential SQL injection: raw query without parameters" });
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
      const files = fs.readdirSync(dir, { withFileTypes: true }); // nosemgrep: javascript_pathtraversal_rule-non-literal-fs-filename - intentionally walks fixed source tree from process.cwd()
      for (const file of files) {
        const fullPath = path.join(dir, file.name); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal - path.join from readdirSync of fixed source tree
        if (file.isDirectory() && !fullPath.includes("node_modules") && !fullPath.includes("__tests__")) {
          walkDir(fullPath);
        } else if (file.name.endsWith(".router.js") && file.isFile()) {
          try {
            const content = fs.readFileSync(fullPath, "utf8");
            if (content.includes("router.route(") && !content.includes("protect") && !content.includes("requireSuperAdmin")) {
              issues.push({ file: fullPath.replace(process.cwd() + "/", ""), severity: "medium", description: "Router may lack authentication middleware" });
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
// force codeql refresh
