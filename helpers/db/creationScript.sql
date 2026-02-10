CREATE TABLE IF NOT EXISTS PERMISSIONS (
  torn_user_id INTEGER NOT NULL,
  permission_type TEXT NOT NULL,
  permission_value TEXT
);

INSERT OR IGNORE INTO PERMISSIONS (torn_user_id, permission_type, permission_value)
VALUES
(2323763, 'ADMIN', NULL),
(2323763, 'FACTION', '45151'),
(2323763, 'USER', '2323763');

CREATE TABLE IF NOT EXISTS USERS (
  user_id INTEGER PRIMARY KEY,
  discord_id TEXT NOT NULL
);
