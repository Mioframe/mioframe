import { describe, expect, it } from 'vitest';
import {
  clampPointToRect,
  getVirtualActiveRect,
  normalizeVector,
  projectRectOntoVector,
  shouldDisplaceTarget,
  type Rect,
} from './geometry';

const rect = (left: number, top: number, width: number, height: number): Rect => ({
  left,
  top,
  width,
  height,
});

describe('getVirtualActiveRect', () => {
  it('derives the rect from pointer position minus the grab offset, preserving size', () => {
    const virtual = getVirtualActiveRect(
      { x: 120, y: 80 },
      { x: 20, y: 10 },
      { width: 100, height: 40 },
    );

    expect(virtual).toEqual({ left: 100, top: 70, width: 100, height: 40 });
  });
});

describe('normalizeVector', () => {
  it('returns a unit vector for a non-zero input', () => {
    const normalized = normalizeVector({ x: 3, y: 4 });

    expect(normalized).toEqual({ x: 0.6, y: 0.8 });
  });

  it('returns null for a zero-length vector', () => {
    expect(normalizeVector({ x: 0, y: 0 })).toBeNull();
  });
});

describe('projectRectOntoVector', () => {
  it('projects a rect onto the horizontal axis', () => {
    const projection = projectRectOntoVector(rect(10, 0, 20, 5), { x: 1, y: 0 });

    expect(projection).toEqual({ min: 10, max: 30 });
  });

  it('projects a rect onto the vertical axis', () => {
    const projection = projectRectOntoVector(rect(0, 10, 5, 20), { x: 0, y: 1 });

    expect(projection).toEqual({ min: 10, max: 30 });
  });
});

describe('shouldDisplaceTarget', () => {
  it('does not reorder when the virtual rect barely touches the target (below half-extent overlap)', () => {
    // Equal-sized 100-wide items sitting side by side; the active flow slot is
    // to the left of the target, so half the smaller extent is 50.
    const activeFlow = rect(0, 0, 100, 100);
    const target = rect(100, 0, 100, 100);
    // Virtual rect overlaps the target by only 30px (< 50 needed).
    const virtual = rect(30, 0, 100, 100);

    expect(shouldDisplaceTarget(virtual, activeFlow, target)).toBe(false);
  });

  it('reorders once overlap reaches half of the smaller projected extent', () => {
    const activeFlow = rect(0, 0, 100, 100);
    const target = rect(100, 0, 100, 100);
    // Virtual rect overlaps the target by exactly 50px.
    const virtual = rect(50, 0, 100, 100);

    expect(shouldDisplaceTarget(virtual, activeFlow, target)).toBe(true);
  });

  it('handles a smaller active item moving into a larger target', () => {
    // Vertically centered on the active flow slot (y-centers both at 20) so the
    // displacement direction is purely horizontal and easy to reason about.
    const activeFlow = rect(0, 0, 40, 40);
    const target = rect(40, -80, 200, 200);
    // Smaller extent is the active item's 40px width; half is 20px.
    const virtualBelowThreshold = rect(10, 0, 40, 40); // overlaps target by 10px
    const virtualAtThreshold = rect(20, 0, 40, 40); // overlaps target by 20px

    expect(shouldDisplaceTarget(virtualBelowThreshold, activeFlow, target)).toBe(false);
    expect(shouldDisplaceTarget(virtualAtThreshold, activeFlow, target)).toBe(true);
  });

  it('handles a larger active item moving into a smaller target', () => {
    // Vertically centered on the active flow slot (y-centers both at 100) so the
    // displacement direction is purely horizontal.
    const activeFlow = rect(0, 0, 200, 200);
    const target = rect(200, 80, 40, 40);
    // Smaller extent is the target's 40px width; half is 20px.
    const virtualBelowThreshold = rect(10, 0, 200, 200); // overlaps target by 10px
    const virtualAtThreshold = rect(20, 0, 200, 200); // overlaps target by 20px

    expect(shouldDisplaceTarget(virtualBelowThreshold, activeFlow, target)).toBe(false);
    expect(shouldDisplaceTarget(virtualAtThreshold, activeFlow, target)).toBe(true);
  });

  it('works for diagonal movement', () => {
    const activeFlow = rect(0, 0, 100, 100);
    const target = rect(100, 100, 100, 100);
    // Direction vector is (1,1) normalized; place the virtual rect so it
    // clearly crosses the halfway point diagonally toward the target.
    const virtual = rect(70, 70, 100, 100);

    expect(shouldDisplaceTarget(virtual, activeFlow, target)).toBe(true);
  });

  it('works for reverse movement (target to the left/above the active flow slot)', () => {
    const activeFlow = rect(100, 0, 100, 100);
    const target = rect(0, 0, 100, 100);
    const virtual = rect(30, 0, 100, 100);

    expect(shouldDisplaceTarget(virtual, activeFlow, target)).toBe(true);
  });

  it('falls back to the virtual rect center when the flow slot and target share a center', () => {
    const activeFlow = rect(0, 0, 100, 100);
    const target = rect(0, 0, 100, 100);
    // Virtual center (70,50) is right of the shared center, so the fallback
    // direction points left (-1,0); moving the virtual rect left by enough
    // covers more than half of the target along that direction.
    const virtual = rect(20, 0, 100, 100);

    expect(shouldDisplaceTarget(virtual, activeFlow, target)).toBe(true);
  });

  it('returns false when every reference point coincides (no defined direction)', () => {
    const activeFlow = rect(0, 0, 100, 100);
    const target = rect(0, 0, 100, 100);
    const virtual = rect(0, 0, 100, 100);

    expect(shouldDisplaceTarget(virtual, activeFlow, target)).toBe(false);
  });

  it('returns false when a projected extent collapses to zero', () => {
    const activeFlow = rect(0, 0, 0, 100);
    const target = rect(50, 0, 100, 100);
    const virtual = rect(50, 0, 0, 100);

    expect(shouldDisplaceTarget(virtual, activeFlow, target)).toBe(false);
  });
});

describe('clampPointToRect', () => {
  it('leaves a point inside the rect unchanged', () => {
    expect(clampPointToRect({ x: 5, y: 5 }, rect(0, 0, 10, 10))).toEqual({ x: 5, y: 5 });
  });

  it('clamps a point outside each edge to the nearest visible edge', () => {
    const bounds = rect(0, 0, 10, 10);

    expect(clampPointToRect({ x: -5, y: 5 }, bounds)).toEqual({ x: 0, y: 5 });
    expect(clampPointToRect({ x: 15, y: 5 }, bounds)).toEqual({ x: 10, y: 5 });
    expect(clampPointToRect({ x: 5, y: -5 }, bounds)).toEqual({ x: 5, y: 0 });
    expect(clampPointToRect({ x: 5, y: 15 }, bounds)).toEqual({ x: 5, y: 10 });
  });
});
