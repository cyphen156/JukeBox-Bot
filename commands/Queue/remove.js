const { SlashCommandBuilder } = require('discord.js');
const Jukebox = require('../../jukebox');

module.exports =
{
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('대기열에서 제거 (인덱스 없으면 마지막)')
    .addIntegerOption(o =>
      o.setName('index')
      .setDescription('1부터 시작하는 인덱스')
      .setRequired(false)
    ),
  async execute(interaction)
  {
    const gid = interaction.guildId;
    const idx1 = interaction.options.getInteger('index', false);
    const index0 = (idx1 !== null && idx1 > 0) ? (idx1 - 1) : null;

    const removed = Jukebox.remove(gid, index0);

    if (!removed)
    {
      await interaction.reply('⚠️ 제거할 항목이 없습니다.');
      return;
    }

    await interaction.reply(`➖ 제거: **${removed.title}** (by ${removed.requestedBy})`);
  }
};