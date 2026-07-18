import { afterEach, describe, expect, it } from 'vitest';
import { getReorderScrollCandidates } from './getReorderScrollCandidates';

const createElement = (styles: Partial<CSSStyleDeclaration>, parent: Element): HTMLElement => {
  const element = document.createElement('div');
  Object.assign(element.style, styles);
  parent.append(element);
  return element;
};

// happy-dom does not implement `offsetParent` (no real layout engine), so
// `getNearestViewportFixedAncestor`'s browser-resolved containing-block check has nothing to read
// by default. Stub it explicitly per scenario, the same way this suite already fakes CSS via
// inline `style` assignment.
const stubOffsetParent = (element: HTMLElement, offsetParent: Element | null): void => {
  Object.defineProperty(element, 'offsetParent', {
    value: offsetParent,
    configurable: true,
  });
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('getReorderScrollCandidates', () => {
  it('preserves nearest-to-farthest order', () => {
    const outerScrollable = createElement({ overflow: 'auto' }, document.body);
    const innerScrollable = createElement({ overflow: 'auto' }, outerScrollable);
    const container = createElement({}, innerScrollable);

    expect(getReorderScrollCandidates(container)).toEqual([
      innerScrollable,
      outerScrollable,
      document.scrollingElement,
    ]);
  });

  it('removes the document candidate but keeps scrollable descendants inside a viewport-fixed boundary', () => {
    const fixedBoundary = createElement({ position: 'fixed', overflow: 'auto' }, document.body);
    stubOffsetParent(fixedBoundary, null);
    const innerScrollable = createElement({ overflow: 'auto' }, fixedBoundary);
    const container = createElement({}, innerScrollable);

    const candidates = getReorderScrollCandidates(container);

    expect(candidates).toEqual([innerScrollable, fixedBoundary]);
    expect(candidates).not.toContain(document.scrollingElement);
  });

  it('does not truncate outside candidates when the fixed element has a non-viewport containing block', () => {
    const transformedAncestor = createElement(
      { transform: 'translateZ(0)', overflow: 'auto' },
      document.body,
    );
    const fixedElement = createElement(
      { position: 'fixed', overflow: 'auto' },
      transformedAncestor,
    );
    // A fixed element whose containing block is `transformedAncestor` (e.g. via `transform`)
    // resolves its `offsetParent` to that ancestor instead of `null`.
    stubOffsetParent(fixedElement, transformedAncestor);
    const innerScrollable = createElement({ overflow: 'auto' }, fixedElement);
    const container = createElement({}, innerScrollable);

    const candidates = getReorderScrollCandidates(container);

    expect(candidates).toEqual([
      innerScrollable,
      fixedElement,
      transformedAncestor,
      document.scrollingElement,
    ]);
  });

  it('includes the container itself when the container is scrollable', () => {
    const outerScrollable = createElement({ overflow: 'auto' }, document.body);
    const container = createElement({ overflow: 'auto' }, outerScrollable);

    expect(getReorderScrollCandidates(container)).toEqual([
      container,
      outerScrollable,
      document.scrollingElement,
    ]);
  });

  it('returns only the document scrolling element when there are no scrollable ancestors', () => {
    const container = createElement({}, document.body);

    expect(getReorderScrollCandidates(container)).toEqual([document.scrollingElement]);
  });
});
