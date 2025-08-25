const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('JukeBox-Bot 설명서'),
  async execute(interaction) {
    return reply(interaction, 'play');
  },
};

async function reply(interaction, content) 
{
    await interaction.reply({ content, ephemeral: true });
}