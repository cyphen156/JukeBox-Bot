const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('현재 음성 채널에서 봇을 퇴장시킵니다.'),
  async execute(interaction) {
    // 길드 ID 기준으로 연결 가져오기
    const connection = getVoiceConnection(interaction.guildId);

    if (!connection) {
      return interaction.reply({ 
        content: '❌ 현재 연결된 음성 채널이 없어요.', 
        ephemeral: true 
      });
    }

    connection.destroy(); // 연결 종료
    return interaction.reply(`✅ 음성 채널에서 퇴장했습니다.`);
  },
};