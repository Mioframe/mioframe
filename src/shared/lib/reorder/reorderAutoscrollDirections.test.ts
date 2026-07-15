import { describe, expect, it } from 'vitest';
import type { AutoscrollRectangle } from './reorderAutoscrollDirections';
import { getAllowedAutoscrollDirections } from './reorderAutoscrollDirections';

const rect = (partial: Partial<AutoscrollRectangle>): AutoscrollRectangle => ({
  top: 0,
  right: 100,
  bottom: 100,
  left: 0,
  ...partial,
});

describe('getAllowedAutoscrollDirections', () => {
  it('allows no direction when the container is fully visible within the ancestor', () => {
    const containerRect = rect({ top: 10, right: 90, bottom: 90, left: 10 });
    const visibleAncestorRect = rect({});

    expect(getAllowedAutoscrollDirections('ancestor', containerRect, visibleAncestorRect)).toEqual({
      up: false,
      down: false,
      left: false,
      right: false,
    });
  });

  it('allows up when the container is clipped above the visible ancestor rectangle', () => {
    const containerRect = rect({ top: -50, bottom: 90 });
    const visibleAncestorRect = rect({});

    const allowed = getAllowedAutoscrollDirections('ancestor', containerRect, visibleAncestorRect);

    expect(allowed).toEqual({ up: true, down: false, left: false, right: false });
  });

  it('allows down when the container is clipped below the visible ancestor rectangle', () => {
    const containerRect = rect({ top: 10, bottom: 150 });
    const visibleAncestorRect = rect({});

    const allowed = getAllowedAutoscrollDirections('ancestor', containerRect, visibleAncestorRect);

    expect(allowed).toEqual({ up: false, down: true, left: false, right: false });
  });

  it('allows left when the container is clipped to the left of the visible ancestor rectangle', () => {
    const containerRect = rect({ left: -50, right: 90 });
    const visibleAncestorRect = rect({});

    const allowed = getAllowedAutoscrollDirections('ancestor', containerRect, visibleAncestorRect);

    expect(allowed).toEqual({ up: false, down: false, left: true, right: false });
  });

  it('allows right when the container is clipped to the right of the visible ancestor rectangle', () => {
    const containerRect = rect({ left: 10, right: 150 });
    const visibleAncestorRect = rect({});

    const allowed = getAllowedAutoscrollDirections('ancestor', containerRect, visibleAncestorRect);

    expect(allowed).toEqual({ up: false, down: false, left: false, right: true });
  });

  it('allows down and right independently when the container is clipped on both edges', () => {
    const containerRect = rect({ bottom: 150, right: 150 });
    const visibleAncestorRect = rect({});

    const allowed = getAllowedAutoscrollDirections('ancestor', containerRect, visibleAncestorRect);

    expect(allowed).toEqual({ up: false, down: true, left: false, right: true });
  });

  it('rejects every direction for a scrollable element unrelated to the reorder container', () => {
    const containerRect = rect({ bottom: 150, right: 150 });
    const visibleAncestorRect = rect({});

    const allowed = getAllowedAutoscrollDirections('unrelated', containerRect, visibleAncestorRect);

    expect(allowed).toEqual({ up: false, down: false, left: false, right: false });
  });

  it('delegates the reorder container itself to standard, unrestricted autoscroll', () => {
    const containerRect = rect({ top: 10, right: 90, bottom: 90, left: 10 });
    const visibleAncestorRect = rect({});

    const allowed = getAllowedAutoscrollDirections('container', containerRect, visibleAncestorRect);

    expect(allowed).toEqual({ up: true, down: true, left: true, right: true });
  });

  it('treats a clip within tolerance as fully visible', () => {
    const containerRect = rect({ top: -0.4, bottom: 100.4 });
    const visibleAncestorRect = rect({});

    const allowed = getAllowedAutoscrollDirections(
      'ancestor',
      containerRect,
      visibleAncestorRect,
      1,
    );

    expect(allowed).toEqual({ up: false, down: false, left: false, right: false });
  });
});
