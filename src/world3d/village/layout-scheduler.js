export function layoutDelay(entries) {
  const models = entries.reduce((sum, { count }) =>
    sum + Math.floor(count / 10) + Math.floor(count % 10 / 3) + count % 10 % 3, 0);
  return models <= 5 ? 35 : Math.min(1850, 100 + (models - 5) * 14);
}

export function createLayoutScheduler(compute, apply, { set = setTimeout, clear = clearTimeout } = {}) {
  let timer;
  let revision = 0;
  let key;

  function cancel() {
    clear(timer);
    revision += 1;
    key = undefined;
  }

  return {
    cancel,
    request(entries, nextKey) {
      if (nextKey === key) return;
      clear(timer);
      key = nextKey;
      const current = ++revision;
      const delay = layoutDelay(entries);
      timer = set(() => {
        compute(entries, delay, (result) => {
          if (current === revision) apply(result, nextKey);
        });
      }, delay);
    },
  };
}
