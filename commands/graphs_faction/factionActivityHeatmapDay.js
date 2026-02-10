const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const { heatmapDayXHour } = require("../../helpers/graphs/heatmap");
const { dbAll } = require("../../helpers/db/helpers");
const { getUsersPermissions } = require("../../helpers/permissions/handler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fac_activity_heatmap_day")
    .setDescription("Replies with a heatmap of daily activity")
    .addIntegerOption((option) =>
      option
        .setName("faction_id")
        .setDescription("The Faction ID")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription("The number of days to show")
        .setRequired(true),
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

    const factionId = interaction.options.getInteger("faction_id");

    if (!factionId) {
      await interaction.editReply("No faction ID provided");
      return;
    }

    const userPermissions = await getUsersPermissions(interaction.user.id);
    if (!userPermissions.hasFaction(factionId) && !userPermissions.hasAdmin()) {
      await interaction.editReply(
        `You do not have permission to view data for faction ${factionId}`,
      );
      return;
    }

    const days = interaction.options.getInteger("days");

    if (!days) {
      await interaction.editReply("No number of days provided");
      return;
    }

    const includeToday =
      interaction.options.getBoolean("include_today") || false;
    const includeIdle = interaction.options.getBoolean("include_idle") || false;

    const queryDaily = `
      SELECT
        m.faction_id,
        m.faction_name,
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
        AND m.faction_id = ?
      GROUP BY
        m.faction_id,
        day,
        hour_of_day
      ORDER BY
        m.faction_id,
        day,
        hour_of_day;
    `;

    try {
      const rows = await dbAll(queryDaily, [days, factionId]);

      if (!rows.length) {
        await interaction.editReply(
          `No activity data found for faction ${factionId} over the last ${days} days.`,
        );
        return;
      }

      await interaction.editReply(
        "Rendering your heatmap, this may take a few seconds...",
      );

      const outputBase = path.resolve(
        `./out/${factionId}_Activity_Heatmap_Day_Faction`,
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
        content: `Daily activity heatmap for faction ${factionId} over the last ${days} days ${includeToday ? "(including today)" : "(excluding today)"}${includeIdle ? " (including idle time)" : ""}`,
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
