const locks = new Map();

export function withItemLock(itemId, action) {
  const current = locks.get(itemId) || Promise.resolve();
  let release;
  const next = new Promise((resolve) => {
    release = resolve;
  });

  locks.set(itemId, current.then(() => next));

  return current
    .then(action)
    .finally(() => {
      release();
      if (locks.get(itemId) === next) {
        locks.delete(itemId);
      }
    });
}
