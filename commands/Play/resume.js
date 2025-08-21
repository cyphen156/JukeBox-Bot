const { SlashCommandBuilder } = require('discord.js');
const Jukebox = require('../../jukebox');

module.exports = {
  data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('일시정지 해제'),
    async execute(interaction)
    {
        Jukebox.resume(interaction.guildId);
        await interaction.reply('▶️ 재개');
    }
};