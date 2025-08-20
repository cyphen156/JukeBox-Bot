const { SlashCommandBuilder } = require('discord.js');
const { state } = require('../../components/youtube/player');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('재생 중지 및 연결 종료'),
  async execute(interaction) {
    const g = state.byGuild.get(interaction.guildId);
    if (!g) {
      return interaction.reply({ content: '재생 중이 아닙니다.', ephemeral: true });
    }
    try {
      g.queue.length = 0;
      g.player?.stop(true);
      g.connection?.destroy();
    } catch (_) {}
    state.byGuild.delete(interaction.guildId);
    await interaction.reply('🛑 재생을 중지하고 연결을 종료했습니다.');
  },
};