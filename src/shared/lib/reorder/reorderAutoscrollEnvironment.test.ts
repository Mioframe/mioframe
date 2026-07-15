import { afterEach, describe, expect, it } from 'vitest';
import { acquireReorderAutoscrollEnvironment } from './reorderAutoscrollEnvironment';

const createElement = (parent: Element = document.body): HTMLElement => {
  const element = document.createElement('div');
  parent.append(element);
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('acquireReorderAutoscrollEnvironment', () => {
  it('applies scroll-snap-type: none !important to each unique HTML candidate', () => {
    const first = createElement();
    const second = createElement();

    acquireReorderAutoscrollEnvironment([first, second]);

    for (const element of [first, second]) {
      expect(element.style.getPropertyValue('scroll-snap-type')).toBe('none');
      expect(element.style.getPropertyPriority('scroll-snap-type')).toBe('important');
    }
  });

  it('restores an absent original property by removing it on dispose', () => {
    const element = createElement();

    const environment = acquireReorderAutoscrollEnvironment([element]);
    environment.dispose();

    expect(element.style.getPropertyValue('scroll-snap-type')).toBe('');
  });

  it('restores an existing inline declaration and its priority on dispose', () => {
    const element = createElement();
    element.style.setProperty('scroll-snap-type', 'y proximity');

    const environment = acquireReorderAutoscrollEnvironment([element]);
    environment.dispose();

    expect(element.style.getPropertyValue('scroll-snap-type')).toBe('y proximity');
    expect(element.style.getPropertyPriority('scroll-snap-type')).toBe('');
  });

  it('restores an existing !important inline declaration on dispose', () => {
    const element = createElement();
    element.style.setProperty('scroll-snap-type', 'x mandatory', 'important');

    const environment = acquireReorderAutoscrollEnvironment([element]);
    environment.dispose();

    expect(element.style.getPropertyValue('scroll-snap-type')).toBe('x mandatory');
    expect(element.style.getPropertyPriority('scroll-snap-type')).toBe('important');
  });

  it('does not overwrite a concurrent consumer change made during the drag', () => {
    const element = createElement();
    element.style.setProperty('scroll-snap-type', 'y proximity');

    const environment = acquireReorderAutoscrollEnvironment([element]);

    element.style.setProperty('scroll-snap-type', 'x proximity');

    environment.dispose();

    expect(element.style.getPropertyValue('scroll-snap-type')).toBe('x proximity');
  });

  it('is idempotent across repeated dispose calls', () => {
    const element = createElement();
    element.style.setProperty('scroll-snap-type', 'y proximity');

    const environment = acquireReorderAutoscrollEnvironment([element]);
    environment.dispose();
    environment.dispose();

    expect(element.style.getPropertyValue('scroll-snap-type')).toBe('y proximity');
  });

  it('modifies and restores a duplicate candidate only once', () => {
    const element = createElement();
    element.style.setProperty('scroll-snap-type', 'y proximity');

    const environment = acquireReorderAutoscrollEnvironment([element, element]);
    environment.dispose();

    expect(element.style.getPropertyValue('scroll-snap-type')).toBe('y proximity');
  });
});
