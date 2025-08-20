const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('일시정지'),
  async execute(interaction) {
    await interaction.reply('pause');
  },
};