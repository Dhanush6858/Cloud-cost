/**
 * database.js — sql.js backed SQLite database
 * sql.js is a pure-WASM port of SQLite — no native build tools required.
 * The database is persisted to disk as a binary .db file.
 */
const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');

const dataDir = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(dataDir, 'cloud_costs.db');

// We expose a promise so callers can await the DB being ready.
let _db = null;
let _dbReady = null;

function getDb() {
  if (!_dbReady) {
    _dbReady = initSqlJs().then((SQL) => {
      if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        _db = new SQL.Database(fileBuffer);
      } else {
        _db = new SQL.Database();
      }
      // Enable WAL-mode equivalent (pragma)
      _db.run('PRAGMA journal_mode = MEMORY;');
      return _db;
    });
  }
  return _dbReady;
}

/**
 * Persist the current in-memory database to disk.
 */
function save() {
  if (_db) {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

module.exports = { getDb, save };
