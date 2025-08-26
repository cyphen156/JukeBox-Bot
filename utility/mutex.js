const locks = new Map();

async function withLock(key, fn)
{
  const prev = locks.get(key) || Promise.resolve();
  let release;
  const baton = new Promise((res) => { release = res; });

  locks.set(key, prev.then(() => baton));

  try
  {
    return await fn();
  }
  finally
  {
    release();
    if (locks.get(key) === baton)
    {
      locks.delete(key);
    }
  }
}

module.exports =
{
  withLock,
};
