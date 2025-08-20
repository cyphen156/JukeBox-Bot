const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('큐 체크'),
  async execute(interaction) {
    await interaction.reply('queue');
  },
};