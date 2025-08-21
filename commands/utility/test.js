const { SlashCommandBuilder } = require('discord.js');
const { runTest } = require('../../components/test');

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('검색/URL 해석 테스트 (미입력 시 기본값: antifreeze, 지정 URL)')
        .addStringOption((o) =>
        {
            return o
                .setName('text')
                .setDescription('검색어 (미입력 시 antifreeze)');
        })
        .addStringOption((o) =>
        {
            return o
                .setName('url')
                .setDescription('유튜브 URL (미입력 시 기본 테스트 URL)');
        }),
    async execute(interaction)
    {
        const textInput = interaction.options.getString('text') || '';
        const urlInput = interaction.options.getString('url') || '';

        await interaction.deferReply({ ephemeral: true });

        const ctx =
        {
            user:
            {
                id: interaction.user.id,
                tag: interaction.user.tag
            },
            guild: interaction.guild
                ? { id: interaction.guild.id, name: interaction.guild.name }
                : null
        };

        const out = await runTest(textInput, urlInput, ctx);

        const lines = [];

        lines.push('🧪 **Test 결과**');
        lines.push('');
        lines.push(`입력(TEXT): ${out.inputs.text}`);
        lines.push(`입력(URL) : ${out.inputs.url}`);
        lines.push('');

        lines.push('**[TEXT]**');
        if (out.text.ok)
        {
            lines.push(`• title: ${out.text.result.title}`);
            lines.push(`• videoId: ${out.text.result.videoId}`);
            lines.push(`• url: ${out.text.result.url}`);
        }
        else
        {
            lines.push(`• 실패: ${out.text.error.code} - ${out.text.error.message}`);
        }

        lines.push('');
        lines.push('**[URL]**');
        if (out.url.ok)
        {
            lines.push(`• title: ${out.url.result.title}`);
            lines.push(`• videoId: ${out.url.result.videoId}`);
            lines.push(`• url: ${out.url.result.url}`);
        }
        else
        {
            lines.push(`• 실패: ${out.url.error.code} - ${out.url.error.message}`);
        }

        await interaction.editReply(lines.join('\n'));
    }
};