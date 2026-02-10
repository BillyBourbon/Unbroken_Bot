const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("cake").setDescription("?"),
  async execute(interaction) {
    interaction.reply("||The cakes a lie!||");
  },
};
