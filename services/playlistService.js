
const db  = require('../storage/storage');
const { log } = require('../utility/logger');
const youtube = require('../components/youtube/youtube');

async function showPlayList(gid)
{
    const list = await db.listGuildPlaylists(gid);
    return list;
}

async function infoPlayList(gid, uid, name)
{
    const info = await db.getPlaylistInfo(gid, uid, name);
    return info;
}

async function createPlayList(gid, uid, name)
{
    const ok = await db.createPlaylist(gid, uid, name);
    await log(gid, { userId: uid, action: 'playlist/create', target: name, ok });
    return ok;
}

async function deletePlayList(gid, uid, name)
{
    const ok = await db.deletePlaylist(gid, uid, name);
    await log(gid, { userId: uid, action: 'playlist/delete', target: name, ok });
    return ok;
}

async function clearPlaylist(gid, uid, name)
{
    const ok = await db.clearTracks(gid, uid, name);
    await log(gid, { userId: uid, action: 'playlist/clear', target: name, ok });
    return ok;
}

async function addTrack(gid, uid, name, input, titleOpt)
{
    const track = await youtube.resolveVideo(input, { title: titleOpt });

    const ok = await db.addTrack(gid, uid, name, track);
    await log(gid, {
        userId: uid,
        action: 'playlist/add',
        target: `${name}:${track?.title ?? ''}`,
        ok,
    });
    return ok;
}

async function removeTrack(gid, uid, name, index1)
{
    const ok = await db.removeTrack(gid, uid, name, index1);
    await log(gid, {
        userId: uid,
        action: 'playlist/remove',
        target: `${name}:${index1 ?? 'last'}`,
        ok,
    });
    return ok;
}

module.exports =
{
    showPlayList,
    infoPlayList,
    createPlayList,
    deletePlayList,
    clearPlaylist,
    addTrack,
    removeTrack,
};