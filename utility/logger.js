const fs = require('fs');
const path = require('path');
const time = require('./time');

async function log(guildId
    , { userId = '-'
        , action
        , target = '-'
        , ok = true } = {})
{
    if (!guildId || !action)
    {
        return;   
    }
    const basePath = path.join(process.cwd(), 'storage/data', String(guildId), 'logs');
    if (!fs.existsSync(basePath)) 
    {
        fs.mkdirSync(basePath, { recursive: true });
    }
    const file = path.join(basePath, `${time.getKSTDayString()}.log`);
    const line = `[${time.getKSTLogString()}] user:${userId} ${action} ${target} ok=${ok}\n`;
    await fs.promises.appendFile(file, line, 'utf8');
}

module.exports = { log };
