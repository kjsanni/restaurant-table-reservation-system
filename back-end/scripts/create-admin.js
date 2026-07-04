"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env." + (process.env.NODE_ENV || "development")),
  override: false,
});

const bcrypt = require("bcryptjs");
const { Sequelize } = require("sequelize");

const SALT_ROUNDS = 10;

const run = async () => {
  const env = process.env.NODE_ENV || "development";
  const config = require(path.resolve(__dirname, "..", "config", "config.js"))[env];

  if (!config) {
    console.error(`❌ Missing "${env}" database config in config/config.js`);
    process.exit(1);
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const email = process.env.ADMIN_EMAIL || "admin@rtrs.com";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error("❌ ADMIN_PASSWORD environment variable is required.");
    console.error("   Example: ADMIN_USERNAME=admin ADMIN_EMAIL=admin@rtrs.com ADMIN_PASSWORD=secret123 node scripts/create-admin.js");
    process.exit(1);
  }

  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: config.dialect,
      port: config.port,
      logging: false,
    }
  );

  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database.");

    const [existing] = await sequelize.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (existing.length > 0) {
      console.log("ℹ️  Admin user already exists (id:", existing[0].id, "). No changes made.");
      await sequelize.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await sequelize.query(
      `INSERT INTO users (username, email, password, role, createdAt, updatedAt)
       VALUES (:username, :email, :password, 'admin', NOW(), NOW())`,
      {
        replacements: { username, email, password: hashedPassword },
      }
    );

    console.log("✅ Super admin created successfully:");
    console.log(`   Username: ${username}`);
    console.log(`   Email:    ${email}`);
    console.log(`   Role:     admin`);
    await sequelize.close();
  } catch (err) {
    console.error("❌ Failed to create admin:", err.message);
    await sequelize.close();
    process.exit(1);
  }
};

run();
