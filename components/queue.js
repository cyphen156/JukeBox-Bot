// components/queue.js
const QUEUES = new Map(); // guildId -> [ { url, title, requestedBy } ]

/**
 * command - queue
 * @param {*} gid 
 * @returns 
 */
function get(gid)
{
    if (!QUEUES.has(gid))
    {
        QUEUES.set(gid, []);
    }
    return QUEUES.get(gid);
}

/**
 * command - add
 * @param {*} gid 
 * @param {*} track 
 */
function push(gid, track)
{
    get(gid).push(track);
}

function getNext(gid)
{
    return get(gid).shift() || null;
}
// queue-clear
function clear(gid)
{
    get(gid).length = 0;
}

// queue-show
function snapshot(gid)
{
    return [...get(gid)];
}

// queue-remove (index or tail)
function remove(gid, index = null)
{
    const q = get(gid);
    if (q.length === 0) 
    {
        return null;
    }

    if (index === null || index >= q.length)
    {
        return q.pop();
    }
    return q.splice(index, 1)[0];
}

// queue-shuffle
function shuffle(gid)
{
    const q = get(gid);
    for (let i = q.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j], q[i]];
    }
    return q;
}

module.exports = { get, getNext, push, clear, snapshot, remove, shuffle };