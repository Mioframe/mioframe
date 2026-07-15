import { afterEach, describe, expect, it } from 'vitest';
import { getReorderScrollCandidates } from './getReorderScrollCandidates';

const createElement = (styles: Partial<CSSStyleDeclaration>, parent: Element): HTMLElement => {
  const element = document.createElement('div');
  Object.assign(element.style, styles);
  parent.append(element);
  return element;
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

  it('removes the document candidate but keeps scrollable descendants inside a fixed-position boundary', () => {
    const fixedBoundary = createElement({ position: 'fixed', overflow: 'auto' }, document.body);
    const innerScrollable = createElement({ overflow: 'auto' }, fixedBoundary);
    const container = createElement({}, innerScrollable);

    const candidates = getReorderScrollCandidates(container);

    expect(candidates).toEqual([innerScrollable, fixedBoundary]);
    expect(candidates).not.toContain(document.scrollingElement);
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
