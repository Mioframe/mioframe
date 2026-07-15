import { describe, expect, it, vi } from 'vitest';
import { useScroll } from './index';

const createFakeScrollElement = (initialScrollTop = 0) => {
  const el = document.createElement('div');
  el.scrollTop = initialScrollTop;
  const scrollToMock = vi.fn();
  el.scrollTo = scrollToMock;
  return { el, scrollToMock };
};

describe('useScroll', () => {
  it('retries scrollTo until the element actually reaches the requested position', async () => {
    let calls = 0;
    const { el, scrollToMock } = createFakeScrollElement(50);
    scrollToMock.mockImplementation((options?: ScrollToOptions) => {
      calls += 1;
      // The first call is superseded before it can move the element, simulating a smooth
      // scroll queued behind another one already in flight; the second call actually lands.
      if (calls > 1 && options?.top !== undefined) {
        el.scrollTop = options.top;
      }
    });

    const { scrollTo } = useScroll(el, { throttleMs: 1 });

    await scrollTo({ top: 0 });

    expect(el.scrollTop).toBe(0);
    expect(scrollToMock).toHaveBeenCalledTimes(2);
  });

  it('does not re-issue scrollTo once already at the requested position', async () => {
    const { el, scrollToMock } = createFakeScrollElement(0);

    const { scrollTo } = useScroll(el, { throttleMs: 1 });

    await scrollTo({ top: 0 });

    expect(scrollToMock).not.toHaveBeenCalled();
  });

  it('gives up after the bounded number of attempts when the position never settles', async () => {
    const { el, scrollToMock } = createFakeScrollElement(50);

    const { scrollTo } = useScroll(el, { throttleMs: 1 });

    await scrollTo({ top: 0 });

    expect(el.scrollTop).toBe(50);
    expect(scrollToMock).toHaveBeenCalledTimes(3);
  });
});
