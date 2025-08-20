const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('큐 비우기'),
  async execute(interaction) {
    await interaction.reply('clear');
  },
};