
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const { token } = require("./config.json");
const client = new Client({ intents: [GatewayIntentBits.Guilds
	, GatewayIntentBits.GuildVoiceStates]});

const { getVoiceConnection } = require('@discordjs/voice');
const Jukebox = require('./jukebox');
	
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders)
    {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) 
    {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) 
        {
            client.commands.set(command.data.name, command);
		} 
        else 
        {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// 이벤트 등록
client.once(Events.ClientReady, readyClient => {
  console.log(`✅ Ready! Logged in as ${readyClient.user.tag}`);
});

// 로그인 실행
client.login(token);

// 봇 자동 종료
const AUTO_LEAVE_MS = 5 * 60_000;	 // 5분 유예
const _leaveTimers = new Map();		 // key: `${gid}:${cid}` → Timeout
function _key(gid, cid)
{
  return `${gid}:${cid}`;
}

function _countHumans(channel)
{
  if (!channel)
  {
    return 0;
  }
  return channel.members.filter(m => !m.user.bot).size;
}

function scheduleAutoLeave(guild, channel)
{
  if (!guild || !channel)
  {
    return;
  }

  const gid = guild.id;
  const cid = channel.id;
  const k = _key(gid, cid);

  if (_leaveTimers.has(k))
  {
    return;
  }

  const t = setTimeout(() =>
  {
    _leaveTimers.delete(k);

    try
    {
      const conn = getVoiceConnection(gid);
      if (!conn)
      {
        return;
      }

      const ch = guild.channels.cache.get(cid);
      if (_countHumans(ch) > 0)
      {
        return; // 복귀함
      }

      try { Jukebox.stop(gid); } catch (_) {}
      try { Jukebox.clear(gid); } catch (_) {}
      conn.destroy();
    }
    catch (e)
    {
      console.error('[auto-leave]', e);
    }
  }, AUTO_LEAVE_MS);

  _leaveTimers.set(k, t);
}

function cancelAutoLeave(guild, channel)
{
  if (!guild || !channel)
  {
    return;
  }

  const k = _key(guild.id, channel.id);
  const t = _leaveTimers.get(k);

  if (t)
  {
    clearTimeout(t);
    _leaveTimers.delete(k);
  }
}

client.on(Events.VoiceStateUpdate, (oldState, newState) =>
{
  try
  {
    const guild = newState.guild;
    const conn = getVoiceConnection(guild.id);

    if (!conn)
    {
      return; // 이 길드에서 연결/재생 중 아님
    }

    const channel = guild.channels.cache.get(conn.joinConfig.channelId);
    if (!channel)
    {
      return;
    }

    if (_countHumans(channel) === 0)
    {
      scheduleAutoLeave(guild, channel);
    }
    else
    {
      cancelAutoLeave(guild, channel);
    }
  }
  catch (e)
  {
    console.error('[voiceStateUpdate]', e);
  }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) 
    {
        return;
    }
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) 
    {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try 
    {
		await command.execute(interaction);
	} 
    catch (error)
     {
		console.error(error);
		if (interaction.replied || interaction.deferred) 
        {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} 
        else
        {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

module.exports = client;