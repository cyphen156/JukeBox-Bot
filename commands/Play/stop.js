const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('재생 중지'),
  async execute(interaction) {
    await interaction.reply('stop');
  },
};