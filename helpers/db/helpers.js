/**
 * Performs a query on the database and returns all rows
 * @param {*} db - The database object
 * @param {string} sql - The SQL query to execute
 * @param {*} params - The parameters to pass to the query
 * @returns
 */
const dbAll = (db, sql, params) => {
  if (!sql) {
    throw new Error("No SQL query provided");
  }
  if (typeof sql !== "string") {
    throw new Error("SQL query must be a string");
  }
  if (sql.length === 0) {
    throw new Error("SQL query cannot be empty");
  }

  if (!params) {
    params = [];
  }
  if (!Array.isArray(params)) {
    params = [params];
  }

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  dbAll,
};
