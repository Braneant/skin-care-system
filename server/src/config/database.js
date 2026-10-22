'use strict';

/**
 * better-sqlite3 连接管理
 * - 启动时确保目录存在
 * - 开启 PRAGMA foreign_keys = ON
 * - 执行 schema.sql 建表
 * - 执行 seed.js 播种
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { config } = require('./index');

let db = null;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getDb() {
  if (db) return db;

  ensureDir(path.dirname(config.dbPathAbs));
  db = new Database(config.dbPathAbs);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema();
  seed();

  return db;
}

/**
 * 执行 schema.sql（幂等：CREATE TABLE IF NOT EXISTS）
 */
function initSchema() {
  const schemaPath = path.resolve(__dirname, '../db/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`[database] 找不到 schema.sql：${schemaPath}`);
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(sql);
}

/**
 * 播种种子数据（幂等：INSERT OR IGNORE）
 */
function seed() {
  const { seed: runSeed } = require('../db/seed');
  runSeed(db);
}

module.exports = { getDb, initSchema, seed };
