const
{
    SlashCommandBuilder,
    MessageFlags,
} = require('discord.js');

const svc = require('../../services/playlistService');

async function reply(interaction, content)
{
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
}

module.exports =
{
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('플레이리스트 관리')
        .addSubcommand(sc =>
            sc.setName('show').setDescription('플레이리스트 항목'))
        .addSubcommand(sc =>
            sc.setName('info')
              .setDescription('플레이리스트 상세 보기')
              .addStringOption(o => o.setName('name').setDescription('플레이리스트 이름').setRequired(true)))
        .addSubcommand(sc =>
            sc.setName('create')
              .setDescription('플레이리스트 생성')
              .addStringOption(o => o.setName('name').setDescription('플레이리스트 이름').setRequired(true)))
        .addSubcommand(sc =>
            sc.setName('delete')
              .setDescription('플레이리스트 삭제')
              .addStringOption(o => o.setName('name').setDescription('플레이리스트 이름').setRequired(true)))
        .addSubcommand(sc =>
            sc.setName('add')
              .setDescription('플레이리스트에 곡 추가')
              .addStringOption(o => o.setName('name').setDescription('플레이리스트 이름').setRequired(true))
              .addStringOption(o => o.setName('song').setDescription('검색어/URL/VideoId').setRequired(true))
              .addStringOption(o => o.setName('title').setDescription('표시할 제목(선택)').setRequired(false)))
        .addSubcommand(sc =>
            sc.setName('remove')
              .setDescription('플레이리스트에서 곡 제거')
              .addStringOption(o => o.setName('name').setDescription('플레이리스트 이름').setRequired(true))
              .addIntegerOption(o => o.setName('index').setDescription('1부터 (미입력 시 마지막)').setMinValue(1).setRequired(false)))
        .addSubcommand(sc =>
            sc.setName('clear')
              .setDescription('플레이리스트 비우기')
              .addStringOption(o => o.setName('name').setDescription('플레이리스트 이름').setRequired(true))),

    async execute(interaction)
    {
        const sub  = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');
        const gid  = interaction.guildId;
        const uid  = interaction.user.id;

        try
        {
            switch (sub)
            {
                case 'show':
                {
                    const list = await svc.showPlayList(gid, uid);
                    if (!list?.length)
                    {
                        return reply(interaction, '📃 플레이리스트가 없습니다.');
                    }
                    return reply(interaction, `📃 플레이리스트 목록\n\`\`\`\n${list.join('\n')}\n\`\`\``);
                }

                case 'create':
                {
                    const ok = await svc.createPlayList(gid, uid, name);
                    return reply(interaction, ok ? `🆕 \`${name}\` 생성 완료`
                                                 : `⚠️ \`${name}\` 은(는) 이미 존재합니다.`);
                }

                case 'delete':
                {
                    const ok = await svc.deletePlayList(gid, uid, name);
                    return reply(interaction, ok ? `🗑️ \`${name}\` 삭제 완료`
                                                 : `⚠️ \`${name}\` 을(를) 찾을 수 없습니다.`);
                }

                case 'add':
                {
                    const input = interaction.options.getString('song');
                    const title = interaction.options.getString('title') || undefined;

                    const ok = await svc.addTrack(gid, uid, name, input, title);
                    return reply(interaction, ok ? `➕ \`${name}\`에 추가 완료`
                                                 : `⚠️ 추가 실패. \`${name}\` 또는 입력을 확인하세요.`);
                }

                case 'remove':
                {
                    const index = interaction.options.getInteger('index'); // 1-base or null
                    const ok = await svc.removeTrack(gid, uid, name, index ?? undefined);
                    return reply(interaction, ok
                        ? (index ? `➖ \`${name}\`에서 ${index}번 제거 완료` : `➖ \`${name}\`에서 **마지막 곡** 제거 완료`)
                        : `⚠️ 제거 실패. \`${name}\` 또는 인덱스를 확인하세요.`);
                }

                case 'clear':
                {
                    const ok = await svc.clearPlaylist(gid, uid, name);
                    return reply(interaction, ok ? `🧹 \`${name}\` 비우기 완료`
                                                 : `⚠️ \`${name}\` 을(를) 찾을 수 없습니다.`);
                }

                case 'info':
                {
                    const info = await svc.infoPlayList(gid, uid, name);
                    if (!info)
                    {
                        return reply(interaction, `⚠️ \`${name}\` 을(를) 찾을 수 없습니다.`);
                    }

                    const body = info.tracks.length
                        ? info.tracks.map((t, i) => `${i + 1}. ${t.title} (${t.videoId})`).join('\n')
                        : '(비어있음)';

                    return reply(interaction, `ℹ️ \`${name}\` 상세 (총 ${info.count}곡)\n\`\`\`\n${body}\n\`\`\``);
                }
            }
        }
        catch (err)
        {
            console.error(`[playlist/${sub}]`, err);
            const msg = { content: '⚠️ 오류가 발생했습니다.', flags: MessageFlags.Ephemeral };
            return (interaction.deferred || interaction.replied) ? interaction.followUp(msg) : interaction.reply(msg);
        }
    },
};