const Queue = require('./components/queue');
const Player = require('./components/player');
const State = require('./components/state');
const { resolveVideo } = require('./components/youtube/youtube');

async function add(gid, input, requestedBy)
{
    const meta = await resolveVideo(input);

    Queue.push(gid, {
        url: meta.url,
        title: meta.title,
        videoId: meta.videoId,
        requestedBy
    });

    return meta;
}
function normalizeMeta(t) 
{
    const url = typeof t.url === 'string' ? t.url : '';
    const title = typeof t.title === 'string' ? t.title : '';
    const videoId = typeof t.videoId === 'string' ? t.videoId : '';
    if (!title && !videoId && !url) 
    {
        throw new Error('invalid track meta');
    }
    return { url, title, videoId };
}

async function addPlaylist(payload, opts = {}) 
{
    const guildId = String(payload?.guildId ?? '');
    const tracks  = Array.isArray(payload?.tracks) ? payload.tracks : [];
    const requestedBy = opts?.requestedBy ?? 'unknown';

    if (!guildId) 
    {
        return { ok: false, code: 'INVALID_GUILD', added: 0, failed: 0, preview: [] };
    }
    if (!tracks.length) 
    {
        return { ok: false, code: 'EMPTY', added: 0, failed: 0, preview: [] };
    }
    let added = 0, failed = 0;
    for (const t of tracks) 
    {
        try 
        {
            const meta = normalizeMeta(t);
            Queue.push(guildId, { ...meta, requestedBy });
            added++;
        } 
        catch (e) 
        {
            console.error('[jukebox.addPlaylist] push failed:', e);
            failed++;
        }
    }

    return {
        ok: true,
        code: 'BULK_ENQUEUED',
        added,
        failed,
        preview: tracks.slice(0, 3).map(x => x.title),
    };
}

async function play(gid, input = null, requestedBy = null)
{
    if (input === null) {
        const track = await Player.playNext(gid);
        
        return track
            ? { ok: true, code: 'PLAY_FROM_QUEUE', meta: track }
            : { ok: false, code: 'QUEUE_EMPTY' };
    }
    
    const meta = await resolveVideo(input);

    // 큐에서 같은 videoId 있으면 꺼내기
    const existingIndex = Queue.snapshot(gid)
        .findIndex(t => t.videoId === meta.videoId);

    if (existingIndex >= 0) 
    {
        const track = Queue.remove(gid, existingIndex);
        Queue.get(gid).unshift(track);
    } 
    else
    {
        Queue.get(gid).unshift({
            url: meta.url,
            title: meta.title,
            videoId: meta.videoId,
            requestedBy
        });
    }

    console.log("before skip:", Queue.snapshot(gid));
    const track = await Player.skip(gid);
    console.log("after skip:", track);

    return { ok: true, code: 'PLAY_BY_INPUT', meta: track };
}

function pause(gid)
{
    Player.pause(gid);
}

function resume(gid)
{
    Player.resume(gid);
}

function skip(gid)
{
    Player.skip(gid);
}

function stop(gid)
{
    Player.stop(gid);
}

function queue(gid)
{
    return Queue.snapshot(gid);
}

function clear(gid)
{
    Queue.clear(gid);
}

function remove(gid, index)
{
    return Queue.remove(gid, index);
}

function shuffle(gid)
{
    return Queue.shuffle(gid);
}

function status(gid)
{
    return State.snapshot(gid);
}

module.exports = {
    add,
    addPlaylist,
    play,
    pause,
    resume,
    skip,
    stop,
    queue,
    clear,
    remove,
    shuffle,
    status
};
