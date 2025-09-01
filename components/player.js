// components/player.js
const {
    createAudioPlayer, createAudioResource,
    NoSubscriberBehavior, AudioPlayerStatus,
    getVoiceConnection, VoiceConnectionStatus, entersState, StreamType
} = require('@discordjs/voice');

const { spawn } = require('child_process');
const path = require('path');
const ffmpegPath = require('ffmpeg-static')
const Queue = require('./queue');
const State = require('./state');

const PLAYERS = new Map();
const PROC = new Map();
const ATTACHED_CONN = new Set();

const fs = require("fs");

const logDir = path.resolve(__dirname, "../storage/data/logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(
  path.join(logDir, "service.log"),
  { flags: "a" }
);

function log(...args) {
  const msg = `[${new Date().toISOString()}] ${args.join(" ")}`;
  console.log(msg); 
  logStream.write(msg + "\n"); 
}

const ytdlpPath = process.env.YTDLP_PATH || (
  process.platform === "win32"
    ? path.resolve(__dirname, "../bin/yt-dlp.exe")
    : "yt-dlp"                                    
);

async function killProc(gid) {
  const p = PROC.get(gid);
  if (!p) return;
  if (p.killing) return;
  p.killing = true;

  try {
    // 언파이프/프로세스 종료
    await p.killAll?.();
  } catch {}

  try {
    p.resource?.playStream?.off?.('error', swallowPipeErr);
    p.resource?.playStream?.destroy?.(new Error('SKIP'));
  } catch {}

  PROC.delete(gid);
}

function toWatchUrl(input)
{
    if (typeof input !== 'string') return '';
    const m = /[?&]v=([^&]+)/.exec(input);
    return m ? `https://www.youtube.com/watch?v=${m[1]}` : input;
}

function swallowPipeErr(e) {
  if (!e) return;
  const code = e.code || '';
  const msg = String(e.message || e);
  if (
    code === 'EPIPE' ||
    code === 'ECONNRESET' ||
    code === 'ERR_STREAM_PREMATURE_CLOSE' ||
    /EOF|socket hang up|premature|broken pipe/i.test(msg)
  ) return; // 무시
  console.warn('[stream error]', code, msg);
}

function makePipeFast(url) {
  const y = spawn(ytdlpPath, [
    '-f', 'bestaudio[acodec=opus][ext=webm]/bestaudio[acodec=opus]',
    '--no-playlist',
    '-q',
    '-o', '-',
    url
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  // 첫 바이트를 빨리 받으면 성공으로 간주
  const ready = new Promise((resolve) => {
    let resolved = false;
    const to = setTimeout(() => { if (!resolved) { resolved = true; resolve(false); } }, 300);
    y.stdout.once('data', () => { if (!resolved) { resolved = true; clearTimeout(to); resolve(true); } });
    y.once('close', (code) => { if (!resolved) { resolved = true; clearTimeout(to); resolve(false); } });
  });

  // 에러는 조용히
  y.stdout.on('error', swallowPipeErr);

  const killAll = async () => {
    try { y.stdout.unpipe?.(); } catch {}
    try { y.kill('SIGTERM'); } catch {}
    await new Promise(r => setTimeout(r, 120));
    try { y.kill('SIGKILL'); } catch {}
  };

  return { ytdlp: y, stdout: y.stdout, ready, killAll, type: StreamType.WebmOpus };
}

// --- yt-dlp -> ffmpeg (re-encode to webm/opus) ------------------------------
function makePipeEncode(url) {
  const y = spawn(ytdlpPath, [
    '-f', 'bestaudio/best',
    '--no-playlist',
    '-q',
    '-o', '-',
    url
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  const f = spawn(ffmpegPath, [
    '-loglevel', 'error',
    '-i', 'pipe:0',
    '-vn',
    '-acodec', 'libopus',
    '-ar', '48000',
    '-ac', '2',
    '-b:a', '128k',
    '-f', 'webm',
    'pipe:1'
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  y.stdout.pipe(f.stdin);

  const swallow = swallowPipeErr;
  y.stdout.on('error', swallow);
  f.stdin.on('error', swallow);

  const safeUnpipe = () => {
    try { y.stdout.unpipe(f.stdin); } catch {}
    try { f.stdin.end(); } catch {}
  };

  f.on('close', () => { safeUnpipe(); try { y.kill('SIGKILL'); } catch {} });
  y.on('close', () => { safeUnpipe(); });

  const killAll = async () => {
    safeUnpipe();
    try { f.kill('SIGTERM'); } catch {}
    await new Promise(r => setTimeout(r, 150));
    try { f.kill('SIGKILL'); } catch {}
    try { y.kill('SIGTERM'); } catch {}
    await new Promise(r => setTimeout(r, 120));
    try { y.kill('SIGKILL'); } catch {}
  };

  return { ytdlp: y, ffmpeg: f, stdout: f.stdout, killAll, type: StreamType.WebmOpus };
}

function ensurePlayer(gid) {
  if (PLAYERS.has(gid)) return PLAYERS.get(gid);

  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Pause }
  });

  player.on(AudioPlayerStatus.Idle, () => {
    void killProc(gid);
    State.get(gid).apply(State.Event.END);
    void playNext(gid);
  });

  player.on('error', (err) => {
    console.error(`[player ${gid}] error:`, err);
    void (async () => {
      await killProc(gid);
      State.get(gid).apply(State.Event.FAIL);
      try { await playNext(gid); } catch (e) { console.error('[auto-skip]', e); }
    })();
  });

  PLAYERS.set(gid, player);
  return player;
}

// async function makeAudioResource(url)
// {
//     if (typeof url !== 'string' || !url.startsWith('http')) 
//     {
//         throw new Error('INVALID_TRACK_URL');
//     }

//     const Stream = await playdl.stream(url, { quality: 2 });
//     console.log("stream : " + Stream);
//     return createAudioResource(Stream.stream, {
//         inputType: Stream.type,
//     });
// }

// function makeFfmpegStream(url)
// {
//     const ytdlp = spawn('yt-dlp', ['-f', 'bestaudio/best', '-o', '-', '--quiet'], { stdio: ['ignore', 'pipe', 'pipe'] });
//     const ffmpeg = spawn('ffmpeg',
//         ['-loglevel', 'error', '-i', 'pipe:0', '-f', 's16le', '-ar', '48000', '-ac', '2', 'pipe:1'],
//         { stdio: ['pipe', 'pipe', 'pipe'] });
//     ytdlp.stdout.pipe(ffmpeg.stdin);
//     return ffmpeg;
// }

// player-play (큐에서 곡 꺼내 실행)
async function playNext(gid)
{
    const track = Queue.getNext(gid);
    if (!track)
    {
        State.get(gid).apply(State.Event.END);
        log(`[${gid}] No track found, ending`);
        return null;
    }

    const conn = getVoiceConnection(gid);
    if (!conn)
    {
        log(`[${gid}] VOICE_NOT_CONNECTED`);
        throw new Error('VOICE_NOT_CONNECTED');
    }

    log(`[${gid}] Starting play: ${track.title} (${track.url})`);

    if (!ATTACHED_CONN.has(gid)) 
    {
        ATTACHED_CONN.add(gid);
        conn.on('stateChange', (_o, n) => {
            if (n.status === VoiceConnectionStatus.Destroyed || n.status === VoiceConnectionStatus.Disconnected) 
            {
                log(`[${gid}] Connection destroyed/disconnected`);
                void killProc(gid);
            }
        });
    }
    
    const readyP = entersState(conn, VoiceConnectionStatus.Ready, 15_000);
    await killProc(gid);
    await readyP;

    State.get(gid).apply(State.Event.LOAD);

    const player = ensurePlayer(gid);

    const url = track.videoId
        ? `https://www.youtube.com/watch?v=${track.videoId}`
        : toWatchUrl(track.url);

    if (typeof url !== 'string' || !url.startsWith('http'))
    {
        log(`[${gid}] INVALID_TRACK_URL: ${String(url)}`);
        throw new Error('INVALID_TRACK_URL: ' + String(url));
    }

    log(`[${gid}] Spawning yt-dlp fast pipe for ${url}`);
    const fast = makePipeFast(url);
    const okFast = await fast.ready;  

    let pipe, inputType;
    if (okFast) 
    {
        log(`[${gid}] Fast pipe succeeded`);
        pipe = { ytdlp: fast.ytdlp, stdout: fast.stdout };
        inputType = fast.type;
    } 
    else 
    {
        // 2) 폴백 (인코딩)
        log(`[${gid}] Fast pipe failed, falling back to ffmpeg encode`);
        await fast.killAll();
        const enc = makePipeEncode(url);
        pipe = { ytdlp: enc.ytdlp, ffmpeg: enc.ffmpeg, stdout: enc.stdout };
        inputType = enc.type;
    }

    const resource = createAudioResource(pipe.stdout, { inputType });
    resource.playStream?.on('error', (err) => {
        log(`[${gid}] Stream error: ${err.message || err}`);
        swallowPipeErr(err);
    });

    PROC.set(gid, {
        ...pipe,
        resource,
        killAll: async () => {
        if (pipe.ffmpeg) 
        {
            log(`[${gid}] Killing ffmpeg`); 
            try { pipe.ytdlp?.stdout?.unpipe?.(pipe.ffmpeg?.stdin); } catch {}
            try { pipe.ffmpeg?.stdin?.end?.(); } catch {}
            try { pipe.ffmpeg?.kill?.('SIGTERM'); } catch {}
            await new Promise(r => setTimeout(r, 120));
            try { pipe.ffmpeg?.kill?.('SIGKILL'); } catch {}
        }
        log(`[${gid}] Killing yt-dlp`);
        try { pipe.ytdlp?.kill?.('SIGTERM'); } catch {}
        await new Promise(r => setTimeout(r, 100));
        try { pipe.ytdlp?.kill?.('SIGKILL'); } catch {}
        }
    });

    conn.subscribe(player);
    player.play(resource);

    State.get(gid).apply(State.Event.START);
    log(`[${gid}] Playback started for ${track.title}`);
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
    await killProc(gid); 
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
    killProc(gid); 
    const player = PLAYERS.get(gid);
    if (player)
    {
        player.stop(true);
    }
    Queue.clear(gid);
    State.get(gid).apply(State.Event.STOP);
}

module.exports = { playNext, pause, resume, skip, stop };
