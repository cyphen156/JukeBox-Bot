const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('재생'),
  async execute(interaction) {
    await interaction.reply('play');
  },
};