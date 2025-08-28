const fs = require('fs');
const path = require('path');
const { withLock } = require('../utility/mutex');
const { encryptJson, decryptJson } = require('./crypto');
const doc = require('./schema/document');

const BASE_DIR = path.join(process.cwd(), 'storage', 'data');

function ensureDir(dir)
{
    if (!fs.existsSync(dir))
    {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function playlistPath(guildId, userId, playlistName)
{
    return path.join(BASE_DIR, String(guildId), String(userId), `${playlistName}.json.enc`);
}

function lockKey(guildId, userId, playlistName)
{
    return `pl:${guildId}:${userId}:${playlistName}`;
}


async function readPlaylistDoc(guildId, userId, playlistName)
{
    const p = playlistPath(guildId, userId, playlistName);
    if (!fs.existsSync(p))
    {
        return doc.newDocument({ guildId, userId, playlistName });
    }

    const raw = await fs.promises.readFile(p, 'utf8');
    const payload = JSON.parse(raw);
    const r = decryptJson(payload);

    if (!r.ok)
    {
        throw new Error(`decrypt failed for ${p}`);
    }

    const m = doc.migrate(r.value);
    if (!m.ok)
    {
        throw new Error(`document invalid for ${p}: ${m.error}`);
    }

    return m.value;
}

async function writePlaylistDoc(guildId, userId, playlistName, value)
{
    const p = playlistPath(guildId, userId, playlistName);
    ensureDir(path.dirname(p));

    const enc = encryptJson(value);
    if (!enc.ok)
    {
        throw new Error(`encrypt failed for ${p}`);
    }

    await fs.promises.writeFile(p, JSON.stringify(enc.value, null, 2), 'utf8');
}

async function listPlaylists(guildId, userId)
{
    const dir = path.join(BASE_DIR, String(guildId), String(userId));
    if (!fs.existsSync(dir))
    {
        return [];
    }

    const files = await fs.promises.readdir(dir);
    return files
        .filter(f => f.endsWith('.json.enc'))
        .map(f => f.replace(/\.json\.enc$/, ''))
        .sort((a, b) => a.localeCompare(b));
}

async function getPlaylistInfo(guildId, userId, playlistName)
{
    const d = await readPlaylistDoc(guildId, userId, playlistName);
    return {
        guildId     : d.guildId,
        userId      : d.userId,
        playlistName: d.playlistName,
        count       : d.tracks.length,
        tracks      : d.tracks,
    };
}

async function createPlaylist(guildId, userId, playlistName)
{
    const key = lockKey(guildId, userId, playlistName);
    return withLock(key, async () =>
    {
        const p = playlistPath(guildId, userId, playlistName);
        if (fs.existsSync(p))
        {
            return false; // 이미 존재
        }

        const d = doc.newDocument({ guildId, userId, playlistName });
        await writePlaylistDoc(guildId, userId, playlistName, d);
        return true;
    });
}

async function deletePlaylist(guildId, userId, playlistName)
{
    const key = lockKey(guildId, userId, playlistName);
    return withLock(key, async () =>
    {
        const p = playlistPath(guildId, userId, playlistName);
        if (!fs.existsSync(p))
        {
            return false;
        }

        await fs.promises.unlink(p);
        return true;
    });
}

async function addTrack(guildId, userId, playlistName, track)
{
    const key = lockKey(guildId, userId, playlistName);
    return withLock(key, async () =>
    {
        const d = await readPlaylistDoc(guildId, userId, playlistName);

        const nt = doc.newTrack(track);
        const nv = doc.validateAndNormalize({ ...d, tracks: [...d.tracks, nt] });
        if (!nv.ok)
        {
            return false;
        }

        await writePlaylistDoc(guildId, userId, playlistName, nv.value);
        return true;
    });
}

async function removeTrack(guildId, userId, playlistName, index1)
{
    const key = lockKey(guildId, userId, playlistName);
    return withLock(key, async () =>
    {
        const d = await readPlaylistDoc(guildId, userId, playlistName);
        if (d.tracks.length === 0) return false;

        let i = (index1 ?? d.tracks.length) - 1;
        i = Math.max(0, Math.min(i, d.tracks.length - 1));

        d.tracks.splice(i, 1);

        const nv = doc.validateAndNormalize(d);
        if (!nv.ok)
        {
            return false;
        }

        await writePlaylistDoc(guildId, userId, playlistName, nv.value);
        return true;
    });
}

async function clearTracks(guildId, userId, playlistName)
{
    const key = lockKey(guildId, userId, playlistName);
    return withLock(key, async () =>
    {
        const d = await readPlaylistDoc(guildId, userId, playlistName);
        d.tracks = [];

        const nv = doc.validateAndNormalize(d);
        if (!nv.ok)
        {
            return false;
        }

        await writePlaylistDoc(guildId, userId, playlistName, nv.value);
        return true;
    });
}

/* ========== exports ========== */

module.exports =
{
    readPlaylistDoc,
    writePlaylistDoc,

    listPlaylists,
    getPlaylistInfo,

    createPlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    clearTracks,

    playlistPath,
};