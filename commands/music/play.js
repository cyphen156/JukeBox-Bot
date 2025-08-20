const { SlashCommandBuilder } = require('discord.js');
const youtube = require('../../components/youtube/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('유튜브 URL 또는 검색어 재생')
    .addStringOption((o) => o.setName('q').setDescription('URL 또는 검색어').setRequired(true)),
  async execute(interaction) {
    const query = interaction.options.getString('q', true);
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '먼저 음성 채널에 들어오세요.', ephemeral: true });
    }

    await interaction.deferReply();

    const track = await youtube.search(query).catch((e) => {
      console.error('search error:', e);
      return null;
    });
    if (!track) return interaction.editReply('검색 결과가 없습니다.');

    const gid = interaction.guildId;
    let g = youtube.state.byGuild.get(gid);

    if (!g) {
      try {
        g = await youtube.connect(interaction.guild, voiceChannel);
        youtube.registerIdleHandler(g);
        youtube.state.byGuild.set(gid, g);
      } catch (e) {
        console.error('voice connect error:', e);
        return interaction.editReply('음성 채널 접속에 실패했습니다.');
      }
    }

    g.queue.push(track);
    if (!g.isPlaying) {
      const current = g.queue.shift();
      try {
        await youtube.playNow(g, current);
        await interaction.editReply(`▶️ **재생 시작**: ${current.title}`);
      } catch (e) {
        console.error('playNow error:', e);
        await interaction.editReply('재생에 실패했습니다.');
      }
    } else {
      await interaction.editReply(`➕ **대기열 추가**: ${track.title}`);
    }
  },
};