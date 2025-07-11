export const moveArrayValue = (
  arr: unknown[],
  fromIndex: number,
  toIndex: number,
) => {
  const len = arr.length;

  const normalizeIndex = (index: number): number => {
    if (index < 0) index = len + index;
    if (index < 0) return 0;
    if (index >= len) return len - 1;
    return index;
  };

  const from = normalizeIndex(fromIndex);
  const to = normalizeIndex(toIndex);

  if (from === to) return;

  const element = arr[from];

  if (from < to) {
    for (let i = from; i < to; i++) {
      arr[i] = arr[i + 1];
    }
  } else {
    for (let i = from; i > to; i--) {
      arr[i] = arr[i - 1];
    }
  }

  arr[to] = element;
};
