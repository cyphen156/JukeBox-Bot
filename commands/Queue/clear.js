const { SlashCommandBuilder } = require('discord.js');
const Jukebox = require('../../jukebox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('대기열 전체 비우기'),
  async execute(interaction)
  {
    Jukebox.clear(interaction.guildId);
    await interaction.reply('🗑️ 대기열 비움');
  }
};