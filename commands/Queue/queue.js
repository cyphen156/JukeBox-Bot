// commands/Queue/queue.js
const { SlashCommandBuilder } = require('discord.js');
const Jukebox = require('../../jukebox');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('현재 대기열 확인'),
    async execute(interaction)
    {
        const q = Jukebox.queue(interaction.guildId);

        if (q.length === 0)
        {
            await interaction.reply('📭 대기열이 비어있습니다.');
            return;
        }

        const lines = q.map((t, i) => `${i + 1}. ${t.title} (by ${t.requestedBy})`);
        await interaction.reply('🎶 현재 대기열:\n' + lines.join('\n'));
    }
};