const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const playdl = require('play-dl');
const state = require('./state');

async function connect(guild, voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });
  
  await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
  });
  connection.subscribe(player);

  return { connection, player, queue: [], isPlaying: false };
}

async function search(query) {
  if (playdl.yt_validate(query) === 'video') {
    const info = await playdl.video_info(query);
    return { url: info.video_details.url, title: info.video_details.title };
  } else {
    const results = await playdl.search(query, { limit: 1 });
    if (!results.length) return null;
    return { url: results[0].url, title: results[0].title };
  }
}

async function playNow(g, track) {
  g.isPlaying = true;
  const stream = await playdl.stream(track.url, { discordPlayerCompatibility: true });
  const resource = createAudioResource(stream.stream, { inputType: stream.type });
  g.player.play(resource);
}

function registerIdleHandler(g) {
  g.player.on(AudioPlayerStatus.Idle, async () => {
    const next = g.queue.shift();
    if (!next) {
      g.isPlaying = false;
      return;
    }
    try {
      await playNow(g, next);
    } catch (err) {
      console.error('playNext error:', err);
      g.isPlaying = false;
    }
  });
}

module.exports = { connect, search, playNow, registerIdleHandler, state };