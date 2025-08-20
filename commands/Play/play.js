const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const Player = require('../../components/youtube/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('재생')
    .addStringOption(o=>o.setName('q')
    .setDescription('URL 또는 검색어')
    .setRequired(true)),
  async execute(interaction) {
    if (!getVoiceConnection(interaction.guildId)) 
    {
      return interaction.reply({ content: '❌ 먼저 `/join` 하세요.', ephemeral: true });
    }
    await interaction.deferReply();
    try
    {
      const q = interaction.options.getString('q', true);
      const { title } = await Player.enqueue(interaction.guildId, q, interaction.user.tag);
      const started = await Player.playNext(interaction.guildId);
      return interaction.editReply(
        started && started.title === title
          ? `▶️ **${title}** 재생 시작`
          : `➕ **${title}** 큐에 추가`
      );
    }
    catch(e)
    {
      console.error(e);
      return interaction.editReply('⚠️ 재생 실패(검색/스트림 오류)');
    }
  },
};