/**
 * 플레이리스트 파일 스키마
 * - guildId: string
 * - userId: string
 * - playlistName: string
 * - tracks: Track[]
 * - Track = { url: string, title: string, videoId: string }
 */

const SCHEMA_VERSION = 1;

function isObj(x)
{
    return !!x && typeof x === 'object' && !Array.isArray(x);
}

function normalizeTrack(t)
{
    if (!isObj(t)) return null;

    const url = typeof t.url === 'string' ? t.url : '';
    const title = typeof t.title === 'string' ? t.title : '';
    const videoId = typeof t.videoId === 'string' ? t.videoId : '';

    if (!title || !videoId)
    {
        return null;
    }

    return { url, title, videoId };
}

function newDocument({ guildId, userId, playlistName })
{
    return {
        version     : SCHEMA_VERSION,
        guildId     : String(guildId ?? ''),
        userId      : String(userId ?? ''),
        playlistName: String(playlistName ?? ''),
        tracks      : [],
    };
}

function validateAndNormalize(doc)
{
    if (!isObj(doc))
    {
        return { ok: false, error: 'Document is not an object' };
    }

    const out =
    {
        version     : Number(doc.version) || SCHEMA_VERSION,
        guildId     : typeof doc.guildId === 'string' ? doc.guildId : '',
        userId      : typeof doc.userId === 'string' ? doc.userId : '',
        playlistName: typeof doc.playlistName === 'string' ? doc.playlistName : '',
        tracks      : [],
    };

    if (!Array.isArray(doc.tracks))
    {
        return { ok: false, error: 'tracks must be an array' };
    }

    for (const t of doc.tracks)
    {
        const nt = normalizeTrack(t);
        if (nt) out.tracks.push(nt);
    }

    if (!out.guildId || !out.userId || !out.playlistName)
    {
        return { ok: false, error: 'guildId/userId/playlistName are required' };
    }

    return { ok: true, value: out };
}

function migrate(doc)
{
    const v = validateAndNormalize(doc);
    if (!v.ok) return v;

    const out = v.value;

    if ((out.version | 0) < 1)
    {
        out.version = 1;
    }

    return validateAndNormalize(out);
}

function newTrack({ url, title, videoId })
{
    return {
        url    : String(url ?? ''),
        title  : String(title ?? ''),
        videoId: String(videoId ?? ''),
    };
}

module.exports =
{
    SCHEMA_VERSION,
    newDocument,
    newTrack,
    validateAndNormalize,
    migrate,
};