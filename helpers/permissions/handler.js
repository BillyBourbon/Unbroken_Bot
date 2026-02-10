const db = require("../db/botDB");

const getUsersPermissions = async (discordUserId) => {
  const rows = await db.all(
    "SELECT permission_value, permission_type FROM permissions WHERE discord_id = ?",
    [discordUserId],
  );

  const permissions = rows.map((row) => ({
    value: row.permission_value,
    type: row.permission_type,
  }));

  return {
    permissions,
    hasAdmin: () =>
      permissions.some((permission) => permission.type === "ADMIN"),
    hasUser: (tornUserId) =>
      permissions.some(
        (permission) =>
          permission.value === tornUserId && permission.type === "USER",
      ),
    hasFaction: (tornFactionId) =>
      permissions.some(
        (permission) =>
          permission.value === tornFactionId && permission.type === "FACTION",
      ),
  };
};

module.exports = {
  getUsersPermissions,
};
