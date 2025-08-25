const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('show')
    .setDescription('큐에 현재 추가된 목록 보기'),
  async execute(interaction) {
    await interaction.reply('show');
  },
};