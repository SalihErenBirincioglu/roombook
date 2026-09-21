const locks = new Map<string, Promise<void>>();

/**
 * Serializes async work per key within this process. Replaces the Postgres
 * exclusion-constraint backstop for BR-1 now that SQLite has no equivalent;
 * this only guarantees mutual exclusion within a single Node process.
 */
export async function withRoomLock<T>(roomId: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(roomId) ?? Promise.resolve();

  let release!: () => void;
  const tail = previous.then(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  locks.set(roomId, tail);

  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(roomId) === tail) {
      locks.delete(roomId);
    }
  }
}
