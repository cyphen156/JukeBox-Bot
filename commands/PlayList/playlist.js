// commands/playlist.js
const
{
  SlashCommandBuilder,
} = require('discord.js');

module.exports =
{
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('플레이리스트 관리')
    .addSubcommand(sc =>
      sc.setName('show')
        .setDescription('플레이리스트 항목'))
    .addSubcommand(sc =>
      sc.setName('info')
        .setDescription('플레이리스트 상세 보기')
        .addStringOption(o =>
          o.setName('name')
            .setDescription('플레이리스트 이름')
            .setRequired(true)))
    .addSubcommand(sc =>
      sc.setName('create')
        .setDescription('플레이리스트 생성')
        .addStringOption(o =>
          o.setName('name')
            .setDescription('플레이리스트 이름')
            .setRequired(true)))
    .addSubcommand(sc =>
      sc.setName('delete')
        .setDescription('플레이리스트 삭제')
        .addStringOption(o =>
          o.setName('name')
            .setDescription('플레이리스트 이름')
            .setRequired(true)))
    .addSubcommand(sc =>
      sc.setName('add')
        .setDescription('플레이리스트에 곡 추가')
        .addStringOption(o =>
          o.setName('name')
            .setDescription('플레이리스트 이름')
            .setRequired(true))
        .addStringOption(o =>
          o.setName('song')
            .setDescription('곡 제목')
            .setRequired(true)))
    .addSubcommand(sc =>
      sc.setName('remove')
        .setDescription('플레이리스트에서 곡 제거')
        .addStringOption(o =>
          o.setName('name')
            .setDescription('플레이리스트 이름')
            .setRequired(true))
        .addIntegerOption(o =>
          o.setName('index')
            .setDescription('1부터')
            .setMinValue(1)
            .setRequired(false)))
    .addSubcommand(sc =>
      sc.setName('clear')
        .setDescription('플레이리스트 비우기')
        .addStringOption(o =>
          o.setName('name')
            .setDescription('플레이리스트 이름')
            .setRequired(true))),

  async execute(interaction)
  {
    const sub = interaction.options.getSubcommand();
    const name = interaction.options.getString('name');

    try
    {
      switch (sub)
      {
        case 'show':
          return reply(interaction, `📃 전체 플레이리스트 조회`);

        case 'create':
          return reply(interaction, `🆕 \`${name}\` 생성 요청됨`);

        case 'delete':
          return reply(interaction, `🗑️ \`${name}\` 삭제 요청됨`);

        case 'add':
        {
          const song = interaction.options.getString('song');
          return reply(interaction, `➕ \`${name}\`에 추가: **${song}**`);
        }

        case 'remove':
        {
          const index = interaction.options.getInteger('index');
          if (index === null)
          {
            return reply(interaction, `➖ \`${name}\`에서 **마지막 곡** 제거 요청`);
          }
          return reply(interaction, `➖ \`${name}\`에서 ${index}번 제거 요청`);
        }

        case 'clear':
          return reply(interaction, `🧹 \`${name}\` 비우기 요청`);

        case 'info':
          return reply(interaction, `ℹ️ \`${name}\` 상세 보기 요청`);

        default:
          return interaction.reply(
          {
            content: '알 수 없는 서브커맨드입니다.',
            ephemeral: true,
          });
      }
    }
    catch (err)
    {
      console.error(`[playlist/${sub}]`, err);
      const msg =
      {
        content: '⚠️ 오류가 발생했습니다.',
        ephemeral: true,
      };
      return (interaction.deferred || interaction.replied)
        ? interaction.followUp(msg)
        : interaction.reply(msg);
    }
  },
};

async function reply(interaction, content)
{
  await interaction.reply({ content, ephemeral: true });
}
