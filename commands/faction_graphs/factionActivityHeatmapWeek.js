const { SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const { heatmapWeekXDay } = require("../../graphHelpers/heatmap");
const db = require("../../helpers/db/db");

function dbAll(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fac_activity_heatmap_week")
    .setDescription("Replies with a heatmap of weekly activity")
    .addIntegerOption((option) =>
      option
        .setName("faction_id")
        .setDescription("The Faction ID")
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    await interaction.editReply("Fetching data...");

    const factionId = interaction.options.getInteger("faction_id");

    if (!factionId) {
      await interaction.editReply("No faction ID provided");
      return;
    }

    const queryWeekly = `
      SELECT
        m.faction_id,
        m.faction_name,
        strftime('%Y-W%W', ua.timestamp, 'unixepoch') AS week,
        strftime('%w', ua.timestamp, 'unixepoch') AS weekday,  -- 0=Sun..6=Sat
        COUNT(*) AS active_minutes
      FROM user_activity ua
      JOIN members m ON m.user_id = ua.user_id
      WHERE
        ua.active_status IN ('online', 'idle')
        AND ua.timestamp >= strftime('%s', 'now', '-28 days')
        AND m.faction_id = ?
      GROUP BY
        m.faction_id,
        week,
        weekday
      ORDER BY
        m.faction_id,
        week,
        weekday;
    `;

    try {
      const rows = await dbAll(queryWeekly, [factionId]);

      if (!rows.length) {
        await interaction.editReply(
          `No activity data found for faction ${factionId}`,
        );
        return;
      }

      await interaction.editReply(
        "Rendering your heatmap, this may take a few seconds...",
      );

      const outputBase = path.resolve(
        `./out/${factionId}_Activity_Heatmap_Week`,
      );
      const pngPath = `${outputBase}.png`;

      await heatmapWeekXDay(rows, outputBase, true);

      await interaction.editReply({
        content: `Weekly activity heatmap for faction ${factionId}`,
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
