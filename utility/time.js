// using KST - UTC+9
function getUTC()
{
    const currentTime = new Date();
    const utc = currentTime.getTime() +
    currentTime.getTimezoneOffset() * 60 * 1000;
    
    return new Date(utc);
}

function getKST()
{
    const utc = getUTC();
    const kst = utc.getTime() + 9 * 60 * 60 * 1000;
    return new Date(kst);
}

function getKSTLogString() {
    const day = getKST();
    const yy = day.getUTCFullYear();
    const mm = String(day.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(day.getUTCDate()).padStart(2, '0');
    const hh = String(day.getUTCHours()).padStart(2, '0');
    const mi = String(day.getUTCMinutes()).padStart(2, '0');
    const ss = String(day.getUTCSeconds()).padStart(2, '0');
    const ms = String(day.getUTCMilliseconds()).padStart(3, '0');
    return `${yy}-${mm}-${dd} ${hh}:${mi}:${ss}.${ms}`;
}

function getKSTDayString() {
    const d = getKST();
    const yy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}
module.exports = 
{
    getUTC, 
    getKST,
    getKSTLogString,
    getKSTDayString,
};