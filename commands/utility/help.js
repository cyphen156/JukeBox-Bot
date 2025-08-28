// commands/help.js
const
{
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  MessageFlags,
} = require('discord.js');

const TEXT =
{
  jukebox:
`📀 주크박스 봇 관련 명령어
/join   : 음성 채널에 입장
/leave  : 음성 채널에서 퇴장
/help   : 도움말 표시`,

  playback:
`🎶 음악 재생 명령어
/play    : 음악 재생
/pause   : 일시 정지
/stop    : 정지
/resume  : 이어서 재생
/skip    : 다음 곡으로`,

  queue:
`📋 큐 관련 명령어
/add     : 큐에 추가
/clear   : 큐 초기화
/queue   : 현재 큐 보기
/remove  : 특정 곡 제거
/show    : 큐 상세 보기
/shuffle : 큐 셔플`,

  playlist:
`📂 플레이리스트 관련 명령어
/playlist show    : 플레이리스트 보기
/playlist info    : 특정 플레이리스트 상세 보기
/playlist create  : 플레이리스트 생성
/playlist delete  : 플레이리스트 삭제
/playlist add     : 플레이리스트에 곡 추가
/playlist remove  : 플레이리스트에서 곡 제거
/playlist clear   : 플레이리스트 비우기
/playlist queue   : 플레이리스트 큐에 추가하기`,
};

function render(category)
{
  const header = '🎵 **JukeBox-Bot 사용 가이드**\n원하는 카테고리를 선택하세요.\n';
  const body = TEXT[category] ?? TEXT.jukebox;
  return `${header}\n\`\`\`\n${body}\n\`\`\``;
}

function buildRow(active)
{
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help:select')
        .setPlaceholder('카테고리를 선택하세요')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('주크박스 봇')
            .setDescription('입장/퇴장/도움말')
            .setValue('jukebox')
            .setDefault(active === 'jukebox'),

          new StringSelectMenuOptionBuilder()
            .setLabel('재생')
            .setDescription('재생/일시정지/정지/스킵')
            .setValue('playback')
            .setDefault(active === 'playback'),

          new StringSelectMenuOptionBuilder()
            .setLabel('큐')
            .setDescription('추가/삭제/셔플/큐 보기')
            .setValue('queue')
            .setDefault(active === 'queue'),

          new StringSelectMenuOptionBuilder()
            .setLabel('플레이리스트')
            .setDescription('show/info/create/delete/add/remove/clear')
            .setValue('playlist')
            .setDefault(active === 'playlist'),
        )
    );
}

module.exports =
{
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('JukeBox-Bot 설명서'),

  async execute(interaction)
  {
    const userId = interaction.user.id;
    let active = 'jukebox';

    const msg = await interaction.reply(
    {
      content: render(active),
      components: [buildRow(active)],
      flags: MessageFlags.Ephemeral,
    });

    const filter = (i) =>
    {
      return i.isStringSelectMenu()
        && i.customId === 'help:select'
        && i.user.id === userId;
    };

    while (true)
    {
      try
      {
        const i = await msg.awaitMessageComponent(
        {
          componentType: ComponentType.StringSelect,
          filter,
          time: 60_000,
        });

        const next = i.values && i.values[0] ? i.values[0] : active;
        active = next;

        await i.update(
        {
          content: render(active),
          components: [buildRow(active)],
        });
      }
      catch
      {
        try
        {
          const row = buildRow(active);
          row.components[0].setDisabled(true);

          await interaction.editReply(
          {
            content: render(active) + '\n_세션이 만료되어 메뉴가 비활성화되었습니다._',
            components: [row],
          });
        }
        catch {}
        break;
      }
    }
  },
};
