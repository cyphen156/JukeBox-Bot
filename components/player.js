// components/player.js
const {
    createAudioPlayer, createAudioResource,
    NoSubscriberBehavior, AudioPlayerStatus,
    getVoiceConnection, VoiceConnectionStatus, entersState, StreamType
} = require('@discordjs/voice');

const { spawn } = require('child_process');
const Queue = require('./queue');
const State = require('./state');

const PLAYERS = new Map();

function ensurePlayer(gid)
{
    if (PLAYERS.has(gid))
    {
        return PLAYERS.get(gid);
    }

    const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Pause }
    });

    player.on(AudioPlayerStatus.Idle, () =>
    {
        State.get(gid).apply(State.Event.END);
        void playNext(gid);
    });

    player.on('error', (err) =>
    {
        console.error(`[player ${gid}] error:`, err);
        State.get(gid).apply(State.Event.FAIL);
    });

    PLAYERS.set(gid, player);
    return player;
}

function makeFfmpegStream(url)
{
    const ytdlp = spawn('yt-dlp', ['-f', 'bestaudio/best', '-o', '-', '--quiet'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const ffmpeg = spawn('ffmpeg',
        ['-loglevel', 'error', '-i', 'pipe:0', '-f', 's16le', '-ar', '48000', '-ac', '2', 'pipe:1'],
        { stdio: ['pipe', 'pipe', 'pipe'] });
    ytdlp.stdout.pipe(ffmpeg.stdin);
    return ffmpeg;
}

// player-play (큐에서 곡 꺼내 실행)
async function playNext(gid)
{
    const track = Queue.getNext(gid);
    if (!track)
    {
        State.get(gid).apply(State.Event.END);
        return null;
    }

    const conn = getVoiceConnection(gid);
    if (!conn)
    {
        throw new Error('VOICE_NOT_CONNECTED');
    }

    await entersState(conn, VoiceConnectionStatus.Ready, 15_000);

    State.get(gid).apply(State.Event.LOAD);

    const player = ensurePlayer(gid);
    // const ffmpeg = makeFfmpegStream(track.url);

    // const resource = createAudioResource(ffmpeg.stdout, { inputType: StreamType.Arbitrary });

    conn.subscribe(player);
    // player.play(resource);

    State.get(gid).apply(State.Event.START);
    return track;
}

// player-pause
function pause(gid)
{
    const player = PLAYERS.get(gid);
    if (player?.pause())
    {
        State.get(gid).apply(State.Event.PAUSE);
    }
}

// player-resume
function resume(gid)
{
    const player = PLAYERS.get(gid);
    if (player?.unpause())
    {
        State.get(gid).apply(State.Event.RESUME);
    }
}

// player-skip
async function skip(gid)
{
    const player = PLAYERS.get(gid);
    if (player)
    {
        player.stop(true);
        State.get(gid).apply(State.Event.SKIP);
    }
    return await playNext(gid);
}

// player-stop
function stop(gid)
{
    const player = PLAYERS.get(gid);
    if (player)
    {
        player.stop(true);
    }
    Queue.clear(gid);
    State.get(gid).apply(State.Event.STOP);
}

module.exports = { playNext, pause, resume, skip, stop };
