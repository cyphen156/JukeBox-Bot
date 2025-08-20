const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('큐에 추가'),
  async execute(interaction) {
    await interaction.reply('add');
  },
};