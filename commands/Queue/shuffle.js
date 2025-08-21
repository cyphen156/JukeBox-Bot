const { SlashCommandBuilder } = require('discord.js');
const Jukebox = require('../../jukebox');

module.exports =
{
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('대기열 셔플'),
  async execute(interaction)
  {
    Jukebox.shuffle(interaction.guildId);
    await interaction.reply('🔀 셔플 완료');
  }
};