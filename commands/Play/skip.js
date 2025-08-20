const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('스킵'),
  async execute(interaction) {
    await interaction.reply('skip');
  },
};