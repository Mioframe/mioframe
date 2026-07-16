import { ScrollDirection } from '@dnd-kit/dom/utilities';
import { describe, expect, it } from 'vitest';
import type { AutoscrollRectangle, ReorderScrollIntent } from './reorderAutoscrollGeometry';
import {
  projectVisibleScrollIntentInput,
  resolveReorderScrollDelta,
} from './reorderAutoscrollGeometry';

const rect = (partial: Partial<AutoscrollRectangle>): AutoscrollRectangle => ({
  top: 0,
  right: 100,
  bottom: 100,
  left: 0,
  ...partial,
});

const idleIntent: ReorderScrollIntent = {
  direction: { x: ScrollDirection.Idle, y: ScrollDirection.Idle },
  speed: { x: 0, y: 0 },
};

const intent = (partial: Partial<ReorderScrollIntent>): ReorderScrollIntent => ({
  ...idleIntent,
  ...partial,
});

describe('projectVisibleScrollIntentInput', () => {
  const full = rect({});

  it('keeps coordinates and tolerance unchanged when the full rectangle is visible', () => {
    expect(projectVisibleScrollIntentInput(full, full, { x: 25, y: 75 })).toEqual({
      coordinates: { x: 25, y: 75 },
      tolerance: { x: 10, y: 10 },
    });
  });

  it('projects relative Y position when clipped at the start', () => {
    expect(projectVisibleScrollIntentInput(full, rect({ top: 50 }), { x: 50, y: 75 })).toEqual({
      coordinates: { x: 50, y: 50 },
      tolerance: { x: 10, y: 20 },
    });
  });

  it('projects relative Y position when clipped at the end', () => {
    expect(projectVisibleScrollIntentInput(full, rect({ bottom: 50 }), { x: 50, y: 45 })).toEqual({
      coordinates: { x: 50, y: 90 },
      tolerance: { x: 10, y: 20 },
    });
  });

  it('projects relative X position when clipped horizontally', () => {
    expect(
      projectVisibleScrollIntentInput(full, rect({ left: 20, right: 60 }), { x: 40, y: 50 }),
    ).toEqual({
      coordinates: { x: 50, y: 50 },
      tolerance: { x: 25, y: 10 },
    });
  });

  it('projects both axes independently when clipped on both axes', () => {
    expect(
      projectVisibleScrollIntentInput(full, rect({ left: 20, right: 60, top: 40, bottom: 80 }), {
        x: 30,
        y: 70,
      }),
    ).toEqual({
      coordinates: { x: 25, y: 75 },
      tolerance: { x: 25, y: 25 },
    });
  });

  it('returns null for zero visible width', () => {
    expect(
      projectVisibleScrollIntentInput(full, rect({ left: 50, right: 50 }), { x: 50, y: 50 }),
    ).toBeNull();
  });

  it('returns null for zero visible height', () => {
    expect(
      projectVisibleScrollIntentInput(full, rect({ top: 50, bottom: 50 }), { x: 50, y: 50 }),
    ).toBeNull();
  });

  it('keeps orthogonal tolerance equivalent to visible CSS pixels', () => {
    const projected = projectVisibleScrollIntentInput(
      full,
      rect({ left: 25, right: 75, top: 20, bottom: 70 }),
      { x: 20, y: 75 },
    );

    expect(projected).not.toBeNull();
    // Five visible pixels outside each visible edge become ten projected pixels outside the
    // corresponding full edge, so a scaled 20px tolerance still means 10 visible CSS pixels.
    expect(projected?.coordinates).toEqual({ x: -10, y: 110 });
    expect(projected?.tolerance).toEqual({ x: 20, y: 20 });
  });
});

describe('resolveReorderScrollDelta', () => {
  it('produces zero delta for a fully visible outer ancestor', () => {
    const containerRect = rect({ top: 10, right: 90, bottom: 90, left: 10 });
    const visibleAncestorRect = rect({});
    const scrollIntent = intent({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Reverse },
      speed: { x: 0, y: 20 },
    });

    expect(
      resolveReorderScrollDelta('ancestor', containerRect, visibleAncestorRect, scrollIntent),
    ).toEqual({ x: 0, y: 0 });
  });

  it('permits only negative Y when the container is hidden above the visible ancestor rectangle', () => {
    const containerRect = rect({ top: -50, bottom: 90 });
    const visibleAncestorRect = rect({});
    const scrollIntent = intent({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Reverse },
      speed: { x: 0, y: 5 },
    });

    expect(
      resolveReorderScrollDelta('ancestor', containerRect, visibleAncestorRect, scrollIntent),
    ).toEqual({ x: 0, y: -5 });
  });

  it('permits only positive Y when the container is hidden below the visible ancestor rectangle', () => {
    const containerRect = rect({ top: 10, bottom: 150 });
    const visibleAncestorRect = rect({});
    const scrollIntent = intent({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Forward },
      speed: { x: 0, y: 5 },
    });

    expect(
      resolveReorderScrollDelta('ancestor', containerRect, visibleAncestorRect, scrollIntent),
    ).toEqual({ x: 0, y: 5 });
  });

  it('permits only negative X when the container is hidden to the left of the visible ancestor rectangle', () => {
    const containerRect = rect({ left: -50, right: 90 });
    const visibleAncestorRect = rect({});
    const scrollIntent = intent({
      direction: { x: ScrollDirection.Reverse, y: ScrollDirection.Idle },
      speed: { x: 5, y: 0 },
    });

    expect(
      resolveReorderScrollDelta('ancestor', containerRect, visibleAncestorRect, scrollIntent),
    ).toEqual({ x: -5, y: 0 });
  });

  it('permits only positive X when the container is hidden to the right of the visible ancestor rectangle', () => {
    const containerRect = rect({ left: 10, right: 150 });
    const visibleAncestorRect = rect({});
    const scrollIntent = intent({
      direction: { x: ScrollDirection.Forward, y: ScrollDirection.Idle },
      speed: { x: 5, y: 0 },
    });

    expect(
      resolveReorderScrollDelta('ancestor', containerRect, visibleAncestorRect, scrollIntent),
    ).toEqual({ x: 5, y: 0 });
  });

  it('calculates X and Y together when the container is hidden on both edges', () => {
    const containerRect = rect({ bottom: 150, right: 150 });
    const visibleAncestorRect = rect({});
    const scrollIntent = intent({
      direction: { x: ScrollDirection.Forward, y: ScrollDirection.Forward },
      speed: { x: 5, y: 5 },
    });

    expect(
      resolveReorderScrollDelta('ancestor', containerRect, visibleAncestorRect, scrollIntent),
    ).toEqual({ x: 5, y: 5 });
  });

  it('treats a hidden distance within tolerance as fully visible', () => {
    const containerRect = rect({ top: -0.4, bottom: 100.4 });
    const visibleAncestorRect = rect({});
    const scrollIntent = intent({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Reverse },
      speed: { x: 0, y: 5 },
    });

    expect(
      resolveReorderScrollDelta('ancestor', containerRect, visibleAncestorRect, scrollIntent, 1),
    ).toEqual({ x: 0, y: 0 });
  });

  it('clamps the delta to the remaining hidden distance', () => {
    const containerRect = rect({ top: -3, bottom: 90 });
    const visibleAncestorRect = rect({});
    const scrollIntent = intent({
      direction: { x: ScrollDirection.Idle, y: ScrollDirection.Reverse },
      speed: { x: 0, y: 25 },
    });

    // hidden top is 3px, minus 1px tolerance leaves 2px of meaningful hidden distance.
    expect(
      resolveReorderScrollDelta('ancestor', containerRect, visibleAncestorRect, scrollIntent),
    ).toEqual({ x: 0, y: -2 });
  });

  it('delegates the reorder container itself to the detected direction and speed, unrestricted by outer geometry', () => {
    // Rects here would forbid every direction for an outer ancestor (container fully inside the
    // visible rectangle), but role `'container'` must ignore that and apply intent directly.
    const containerRect = rect({ top: 10, right: 90, bottom: 90, left: 10 });
    const visibleCandidateRect = rect({});
    const scrollIntent = intent({
      direction: { x: ScrollDirection.Forward, y: ScrollDirection.Reverse },
      speed: { x: 7, y: 9 },
    });

    expect(
      resolveReorderScrollDelta('container', containerRect, visibleCandidateRect, scrollIntent),
    ).toEqual({ x: 7, y: -9 });
  });

  it('produces zero delta for the container when detected intent is idle', () => {
    const containerRect = rect({});
    const visibleCandidateRect = rect({});

    expect(
      resolveReorderScrollDelta('container', containerRect, visibleCandidateRect, idleIntent),
    ).toEqual({ x: 0, y: 0 });
  });
});
