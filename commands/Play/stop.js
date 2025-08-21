const { SlashCommandBuilder } = require('discord.js');
const Jukebox = require('../../jukebox');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('stop')
      .setDescription('현재곡 재생 정지'),
  async execute(interaction)
  {
      Jukebox.stop(interaction.guildId);
      await interaction.reply('⏹️ 정지');
  }
};