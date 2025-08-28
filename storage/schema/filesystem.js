const fs = require('fs');
const path = require('path');
const store = require('../storage');
const doc = require('./document');
const { withLock } = require('../../utility/mutex');

const BASE_DIRECTORY = path.join(process.cwd(), 'storage', 'data');

function ensureDirectory(dir)
{
    if (!fs.existsSync(dir))
    {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function isObj(x)
{
    return !!x && typeof x === 'object' && !Array.isArray(x);
}

function validateFilesystemSpec(spec)
{
    if (!isObj(spec) || !isObj(spec.guilds))
    {
        return { ok: false, message: 'spec.guilds is required object' };
    }

    for (const [gid, g] of Object.entries(spec.guilds))
    {
        if (typeof gid !== 'string' || !isObj(g))
        {
            return { ok: false, message: `guild "${gid}" invalid` };
        }

        if (!isObj(g.users))
        {
            return { ok: false, message: `guild "${gid}".users is required object` };
        }

        for (const [uid, u] of Object.entries(g.users))
        {
            if (typeof uid !== 'string' || !isObj(u))
            {
                return { ok: false, message: `user "${uid}" invalid in guild "${gid}"` };
            }

            if (!isObj(u.playlists))
            {
                return { ok: false, message: `guild "${gid}".users["${uid}"].playlists is required object` };
            }

            for (const [pname, p] of Object.entries(u.playlists))
            {
                if (typeof pname !== 'string' || !isObj(p) || !Array.isArray(p.tracks))
                {
                    return { ok: false, message: `playlist "${pname}" invalid for user "${uid}"` };
                }
            }
        }
    }

    return { ok: true };
}

async function materializeFromSpec(spec)
{
    const v = validateFilesystemSpec(spec);
    if (!v.ok) throw new Error(`filesystem spec invalid: ${v.message}`);

    const tasks = [];

    for (const [gid, g] of Object.entries(spec.guilds))
    {
        const gdir = path.join(BASE_DIRECTORY, String(gid));
        ensureDirectory(gdir);

        for (const [uid, u] of Object.entries(g.users))
        {
            const udir = path.join(gdir, String(uid));
            ensureDirectory(udir);

            for (const [pname, p] of Object.entries(u.playlists))
            {
                const key = `fspec:${gid}:${uid}:${pname}`;
                const task = withLock(key, async () =>
                {
                    const draft =
                    {
                        version     : doc.SCHEMA_VERSION,
                        guildId     : gid,
                        userId      : uid,
                        playlistName: pname,
                        tracks      : Array.isArray(p.tracks) ? p.tracks : [],
                    };

                    const m = doc.migrate(draft);
                    if (!m.ok) throw new Error(`document invalid for "${gid}/${uid}/${pname}": ${m.error}`);

                    await store.writePlaylistDoc(gid, uid, pname, m.value);
                });

                tasks.push(task);
            }
        }
    }

    await Promise.all(tasks);
    return { ok: true, files: tasks.length };
}

module.exports =
{
    validateFilesystemSpec,
    materializeFromSpec,
};