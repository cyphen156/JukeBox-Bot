const { SlashCommandBuilder } = require('discord.js');
const { state } = require('../../components/youtube/player');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('현재 트랙 스킵'),
  async execute(interaction) {
    const g = state.byGuild.get(interaction.guildId);
    if (!g?.player) {
      return interaction.reply({ content: '재생 중인 트랙이 없습니다.', ephemeral: true });
    }
    const ok = g.player.stop(true); // Idle → 다음 곡 재생
    await interaction.reply(ok ? '⏭️ 스킵했습니다.' : '스킵할 수 없습니다.');
  },
};