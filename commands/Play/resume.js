const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('다시 재생'),
  async execute(interaction) {
    await interaction.reply('resume');
  },
};