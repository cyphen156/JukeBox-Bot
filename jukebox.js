// components/jukebox.js
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
    const track = await Player.skip(gid); // 반드시 await
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
