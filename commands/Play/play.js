// commands/Play/play.js
const { SlashCommandBuilder } = require('discord.js');
const Jukebox = require('../../jukebox');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('노래 재생 (검색어/URL)')
        .addStringOption(opt =>
            opt.setName('query')
               .setDescription('검색어, URL 또는 큐 인덱스')
               .setRequired(false)
        ),

    async execute(interaction)
    {
        const gid = interaction.guildId;
        const query = interaction.options.getString('query');
        const requestedBy = interaction.user.tag;

        await interaction.deferReply();

        try
        {
            const result = await Jukebox.play(gid, query || null, requestedBy);

            if (!result.ok)
            {
                await interaction.editReply(`📭 대기열이 비어있습니다.`);
                return;
            }

            const meta = result.meta;
            if (meta)
            {
                await interaction.editReply(`▶️ **${meta.title}** (by ${requestedBy}) 재생`);
            }
            else
            {
                await interaction.editReply(`▶️ 재생 상태: ${result.code}`);
            }
        }
        catch (err)
        {
            console.error('[play cmd]', err);
            await interaction.editReply('❌ 재생 중 오류 발생');
        }
    }
};
