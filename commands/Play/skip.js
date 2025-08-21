const { SlashCommandBuilder } = require('discord.js');
const Jukebox = require('../../jukebox');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('skip')
      .setDescription('현재 곡 스킵'),
    async execute(interaction)
    {
      Jukebox.skip(interaction.guildId);
      await interaction.reply('⏭️ 스킵');
    }
};