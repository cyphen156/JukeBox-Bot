const S = new Map(); // guildId -> { player, queue: [], isPlaying: false }

function get(gid) {
  if (!S.has(gid)) S.set(gid, { player: null, queue: [], isPlaying: false });
  return S.get(gid);
}

// ----- queue helpers (1-based index) -----
function getQueue(gid)           { return [...get(gid).queue]; }
function clear(gid)              { get(gid).queue = []; }
function removeAt(gid, i1) {
  const q = get(gid).queue;
  if (i1 < 1 || i1 > q.length) return false;
  q.splice(i1 - 1, 1);
  return true;
}
function move(gid, from1, to1) {
  const q = get(gid).queue;
  if ([from1, to1].some(n => n < 1 || n > q.length)) return false;
  const [it] = q.splice(from1 - 1, 1);
  q.splice(to1 - 1, 0, it);
  return true;
}
function shuffle(gid) {
  const q = get(gid).queue;
  for (let i = q.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [q[i], q[j]] = [q[j], q[i]];
  }
}

module.exports = { S, get, getQueue, clear, removeAt, move, shuffle };
