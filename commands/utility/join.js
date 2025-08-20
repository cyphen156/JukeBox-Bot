const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Join the Bot at a voice Channel'),
	async execute(interaction) {
		const channel = interaction.member.voice.channel;
		if (!channel) {
			return interaction.reply('❌ 먼저 음성 채널에 들어가 주세요!');
		}

        joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
		});

		await interaction.reply(`✅ ${channel.name} 채널에 접속했어요!`);
	},
};