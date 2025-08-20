// components/youtube/player.js
const {
  createAudioPlayer, createAudioResource, NoSubscriberBehavior,
  AudioPlayerStatus, getVoiceConnection, VoiceConnectionStatus, entersState
} = require('@discordjs/voice');
const playdl = require('play-dl');
const State = require('./state');

function ensurePlayer(gid) {
  const st = State.get(gid);
  if (!st.player) {
    const p = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });

    p.on('stateChange', (oldS, newS) => {
      // Playing/Buffering -> 재생 중, Idle -> 멈춤
      st.isPlaying = (newS.status === AudioPlayerStatus.Playing || newS.status === AudioPlayerStatus.Buffering);
      // console.log(`[player:${gid}] ${oldS.status} -> ${newS.status} | isPlaying=${st.isPlaying}`);
    });

    p.on('error', (e) => {
      console.error('[AudioPlayer error]', e);
      st.isPlaying = false;
    });

    st.player = p;
  }
  return st.player;
}

async function enqueue(gid, query, requestedBy = 'unknown') {
  let url = query, title = query;
  try {
    const t = playdl.yt_validate(query);
    if (t === 'video') {
      const info = await playdl.video_info(query);
      url = info.video_details.url;
      title = info.video_details.title;
    } else {
      const [r] = await playdl.search(query, { source: { youtube: 'video' }, limit: 1 });
      if (!r) throw new Error('NO_RESULTS');
      url = r.url; title = r.title || r.url;
    }
  } catch (e) {
    console.error('[enqueue] search/info failed:', e);
    throw new Error('SEARCH_FAILED');
  }
  State.get(gid).queue.push({ url, title, requestedBy });
  return { url, title };
}

async function playNext(gid) {
  const st = State.get(gid);
  if (st.isPlaying || st.queue.length === 0) return null;

  const conn = getVoiceConnection(gid);
  if (!conn) throw new Error('VOICE_NOT_CONNECTED');

  // ✅ 연결 준비 보장
  await entersState(conn, VoiceConnectionStatus.Ready, 15_000);

  const item = st.queue.shift();
  ensurePlayer(gid);

  try {
    const stream = await playdl.stream(item.url, { discordPlayerCompatibility: true });
    const resource = createAudioResource(stream.stream, { inputType: stream.type });

    conn.subscribe(st.player);      // 구독 먼저
    st.player.play(resource);       // 그다음 재생
    // st.isPlaying 은 stateChange 리스너에서 갱신됨
    return item;                    // <- 아이템 반환
  } catch (e) {
    console.error('[stream/play error]', e);
    st.isPlaying = false;
    // 문제 트랙 건너뛰고 다음 시도
    if (st.queue.length) return playNext(gid);
    return null;
  }
}

function skip(gid){ State.get(gid).player?.stop(true); }
function pause(gid){ return State.get(gid).player?.pause() ?? false; }
function resume(gid){ return State.get(gid).player?.unpause() ?? false; }

const { getQueue, clear, removeAt, move, shuffle } = State;

async function jump(gid, idx1){
  const q = State.get(gid).queue;
  if (idx1 < 1 || idx1 > q.length) return false;
  const [it] = q.splice(idx1 - 1, 1);
  q.unshift(it);
  skip(gid);
  return true;
}

module.exports = { enqueue, playNext, skip, pause, resume, getQueue, clear, removeAt, move, shuffle, jump };
