const sqlite3 = require("sqlite3").verbose();
const { databasePath } = require("../../config.json");
const { dbAll } = require("./helpers");

const db = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Could not open DB in read-only mode", err);
  } else {
    console.log("Connected to SQLite DB (read-only)");
  }
});

db.run("PRAGMA foreign_keys = ON");

module.exports = {
  db,
  dbAll: async (sql, params) => {
    const rows = await dbAll(db, sql, params);
    return rows;
  },
};
