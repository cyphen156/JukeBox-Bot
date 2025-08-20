const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('재생 목록 섞기'),
  async execute(interaction) {
    await interaction.reply('shuffle');
  },
};