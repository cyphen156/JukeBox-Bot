const { SlashCommandBuilder } = require('discord.js');
const Jukebox = require('../../jukebox');

module.exports =
{
  data: new SlashCommandBuilder()
      .setName('pause')
      .setDescription('현재 곡 일시정지'),
  async execute(interaction)
  {
      Jukebox.pause(interaction.guildId);
      await interaction.reply('⏸️ 일시정지');
  }
};
