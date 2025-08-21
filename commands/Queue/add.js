const { SlashCommandBuilder } = require('discord.js');
const Jukebox = require('../../jukebox');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('대기열에 추가')
    .addStringOption(o =>
        o.setName('query')
          .setDescription('검색어 또는 URL')
          .setRequired(true)
      ),
  async execute(interaction)
    {
      const gid = interaction.guildId;
      const query = interaction.options.getString('query', true);
      const requestedBy = interaction.user.tag;

      await interaction.deferReply();

      try
      {
        const meta = await Jukebox.add(gid, query, requestedBy);
        await interaction.editReply(`➕ **${meta.title}** (by ${requestedBy}) 큐에 추가됨`);
      }
      catch (e)
      {
        console.error('[add]', e);
        await interaction.editReply('❌ 추가 실패: ' + (e.message || e));
      }
    }
};