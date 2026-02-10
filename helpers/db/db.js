const sqlite3 = require("sqlite3").verbose();
const { databasePath } = require("../../config.json");

const db = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Could not open DB in read-only mode", err);
  } else {
    console.log("Connected to SQLite DB (read-only)");
  }
});

module.exports = db;
