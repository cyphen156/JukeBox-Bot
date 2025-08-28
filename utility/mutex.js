const locks = new Map();

/**
 * 동일 key에 대해 fn을 항상 순차 실행합니다.
 * - 이전 작업이 실패해도 체인을 유지하여 다음 작업이 막히지 않습니다.
 * - 호출자에게는 fn의 성공/실패를 그대로 전달합니다.
 *
 * @param {string} key
 * @param {() => Promise<any>} fn
 */
async function withLock(key, fn)
{
    const last = locks.get(key) || Promise.resolve();

    const next = last.catch(() => { }).then(() => fn());

    locks.set(key, next);

    try
    {
        return await next;
    }
    finally
    {
        if (locks.get(key) === next)
        {
            locks.delete(key);
        }
    }
}

async function withLockTimeout(key, ms, fn)
{
    let timer;
    const timeoutPromise = new Promise((_, reject) =>
    {
        timer = setTimeout(() => reject(new Error(`lock timeout: ${key}`)), ms);
    });

    try
    {
        return await withLock(key, () => Promise.race([Promise.resolve().then(fn), timeoutPromise]));
    }
    finally
    {
        clearTimeout(timer);
    }
}

module.exports =
{
    withLock,
    withLockTimeout,
};
