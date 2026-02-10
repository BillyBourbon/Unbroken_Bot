const { SlashCommandBuilder } = require("discord.js");
const { dbAll } = require("../../helpers/db/helpers");
const { heatmapDayXHour } = require("../../helpers/graphs/heatmap");
const path = require("path");
const fs = require("fs");
const { getUsersPermissions } = require("../../helpers/permissions/handler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("user_activity_heatmap")
    .setDescription("Create a heatmap of user activity")
    .addIntegerOption((option) =>
      option
        .setName("user_id")
        .setDescription("The User ID")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription("The number of days to show")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("include_today")
        .setDescription("Include today's data")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("include_idle")
        .setDescription("Include idle time")
        .setRequired(false),
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    await interaction.editReply("Fetching data...");

    const userId =
      interaction.options.getInteger("user_id") || interaction.user.id;

    const userPermissions = await getUsersPermissions(interaction.user.id);
    if (!userPermissions.hasUser(userId) && !userPermissions.hasAdmin()) {
      await interaction.editReply(
        `You do not have permission to view data for user ${userId}`,
      );
      return;
    }

    const days = interaction.options.getInteger("days") || 7;

    const includeToday =
      interaction.options.getBoolean("include_today") || false;
    const includeIdle = interaction.options.getBoolean("include_idle") || false;

    if (!userId) {
      await interaction.editReply("No user ID provided");
      return;
    }
    if (!days) {
      await interaction.editReply("No number of days provided");
      return;
    }

    const queryDaily = `
      SELECT
        m.user_id,
        m.username,
        strftime('%Y-%m-%d', ua.timestamp, 'unixepoch', 'utc') AS day,
        strftime('%H', ua.timestamp, 'unixepoch', 'utc') AS hour_of_day,
        COUNT(*) AS active_minutes
      FROM user_activity ua
      JOIN members m ON m.user_id = ua.user_id
      WHERE
        ua.active_status IN ('online'${includeIdle ? ", 'idle'" : ""})
        AND ua.timestamp >= strftime(
          '%s',
          date('now', 'utc', 'start of day', '-' || ? || ' days')
        )
        AND ua.timestamp < strftime(
          '%s',
          date('now', 'utc')
        )
        AND m.user_id = ?
      GROUP BY
        m.user_id,
        day,
        hour_of_day
      ORDER BY
        m.user_id,
        day,
        hour_of_day;
    `;

    try {
      const rows = await dbAll(queryDaily, [days, userId]);

      if (!rows.length) {
        await interaction.editReply(
          `No activity data found for user ${userId} over the last ${days} days.`,
        );
        return;
      }

      await interaction.editReply(
        "Rendering your heatmap, this may take a few seconds...",
      );

      const outputBase = path.resolve(
        `./out/${userId}_Activity_Heatmap_Day_User`,
      );
      const pngPath = `${outputBase}.png`;

      const dayCounts = {};
      rows.forEach((row) => {
        dayCounts[row.day] = (dayCounts[row.day] || 0) + 1;
      });
      const filteredRows = includeToday
        ? rows
        : rows.filter((row) => dayCounts[row.day] >= 24);

      await heatmapDayXHour(filteredRows, outputBase, true);

      await interaction.editReply({
        content: `Daily activity heatmap for user ${userId} over the last ${days} days ${includeToday ? "(including today)" : "(excluding today)"}${includeIdle ? " (including idle time)" : ""}`,
        files: [
          {
            attachment: fs.readFileSync(pngPath),
            name: path.basename(pngPath),
          },
        ],
      });
    } catch (err) {
      console.error("Heatmap command failed:", err);

      await interaction.editReply(
        "Something went wrong while generating the heatmap.",
      );
    }
  },
};
