// components/state.js
const Status =
{
    IDLE: 'IDLE',
    BUFFERING: 'BUFFERING',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    STOPPED: 'STOPPED',
    ERROR: 'ERROR'
};

const Event =
{
    LOAD: 'LOAD',
    START: 'START',
    PAUSE: 'PAUSE',
    RESUME: 'RESUME',
    END: 'END',
    STOP: 'STOP',
    SKIP: 'SKIP',
    FAIL: 'FAIL',
    RESET: 'RESET'
};

const TRANSITIONS =
{
    [Status.IDLE]: { [Event.LOAD]: Status.BUFFERING },
    [Status.BUFFERING]: { [Event.START]: Status.PLAYING, [Event.FAIL]: Status.ERROR, [Event.STOP]: Status.STOPPED },
    [Status.PLAYING]: { [Event.PAUSE]: Status.PAUSED, [Event.END]: Status.IDLE, [Event.STOP]: Status.STOPPED, [Event.FAIL]: Status.ERROR },
    [Status.PAUSED]: { [Event.RESUME]: Status.PLAYING, [Event.STOP]: Status.STOPPED },
    [Status.STOPPED]: { [Event.LOAD]: Status.BUFFERING, [Event.RESET]: Status.IDLE },
    [Status.ERROR]: { [Event.RESET]: Status.IDLE }
};

class PlayerFSM
{
    constructor()
    {
        this.current = Status.IDLE;
        this.updatedAt = Date.now();
    }

    apply(event)
    {
        const next = TRANSITIONS[this.current]?.[event];
        if (next)
        {
            this.current = next;
            this.updatedAt = Date.now();
            return true;
        }
        return false;
    }
}

const STATES = new Map();

function get(gid)
{
    if (!STATES.has(gid))
    {
        STATES.set(gid, new PlayerFSM());
    }
    return STATES.get(gid);
}

function snapshot(gid)
{
    const s = get(gid);
    return { status: s.current, updatedAt: s.updatedAt };
}

module.exports = { Status, Event, get, snapshot };
