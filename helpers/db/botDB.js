const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const { dbAll } = require("./helpers");

const db = new sqlite3.Database("./botDB.db", (err) => {
  if (err) {
    console.error("Could not open DB [botDB.db]: ", err);
  } else {
    console.log("Connected to SQLite DB [botDB.db]");
  }
});

db.run("PRAGMA foreign_keys = ON");

try {
  // eslint-disable-next-line no-undef
  db.exec(fs.readFileSync(__dirname + "/creationScript.sql", "utf8"), (err) => {
    if (err) {
      console.error("Error while creating database:", err);
    } else {
      console.log("Database schema ensured");
    }
  });
} catch (err) {
  console.error("Error while checking database schema:", err);
}

module.exports = {
  db,
  dbAll: async (sql, params) => {
    const rows = await dbAll(db, sql, params);
    return rows;
  },
};
