import { describe, expect, it, vi } from 'vitest';
import {
  REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS,
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_ITEM_ATTRIBUTE,
} from './constants';
import {
  acquireReorderDocumentSelectionSuppression,
  cleanupPostDragInteraction,
  clearOptimisticState,
  cloneReorderItemIdList,
  completeReorderSurfaceDrag,
  createReorderSurfaceState,
  hasSameItemSet,
  isMouseLikeEvent,
  isPointerEvent,
  isSameOrderedIds,
  isTouchLikeEvent,
  previewReorderSurfaceDrag,
  requestReorderSurfaceCancel,
  resetDragState,
  rollbackReorderSurfaceCommit,
  shouldIgnoreTarget,
  shouldUseBestEffortReorderHaptics,
  startReorderSurfaceDrag,
  syncReorderSurfaceExternalItemIdList,
  type ReorderSurfaceState,
} from './useReorderSurface.helpers';
import type { ReorderInputProfile } from './reorderTypes';

const pointerProfile: ReorderInputProfile = {
  input: 'pointer',
  layout: 'vertical',
  density: 'comfortable',
  activation: 'immediate',
  delay: 0,
  moveThreshold: 3,
  suppressClickAfterDrag: true,
  forceFallback: false,
  fallbackOnBody: false,
  animation: 150,
  scrollSpeed: 10,
  scrollSensitivity: 30,
};

const touchProfile: ReorderInputProfile = {
  ...pointerProfile,
  input: 'touch',
  forceFallback: true,
  fallbackOnBody: true,
};

const createState = (
  itemIdList: readonly string[] | undefined = ['a', 'b', 'c'],
): ReorderSurfaceState => createReorderSurfaceState(itemIdList);

const createPointerMoveEvent = (pointerType: string): Event => {
  const event = new Event('pointermove', { bubbles: true, cancelable: true });

  Object.defineProperty(event, 'pointerType', {
    value: pointerType,
    configurable: true,
  });

  return event;
};

describe('useReorderSurface helpers', () => {
  it('clones item lists and preserves undefined as an empty list', () => {
    const source = ['a', 'b'];

    expect(cloneReorderItemIdList(source)).toEqual(['a', 'b']);
    expect(cloneReorderItemIdList(source)).not.toBe(source);
    expect(cloneReorderItemIdList(undefined)).toEqual([]);
  });

  it('compares ordered ids and item sets correctly', () => {
    expect(isSameOrderedIds(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(isSameOrderedIds(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(isSameOrderedIds(['a'], ['a', 'b'])).toBe(false);

    expect(hasSameItemSet(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(hasSameItemSet(['a', 'b'], ['b', 'c'])).toBe(false);
    expect(hasSameItemSet(['a'], ['a', 'b'])).toBe(false);
    expect(hasSameItemSet(['a', 'b'], ['a'])).toBe(false);
  });

  it('creates initial state and clears optimistic bookkeeping', () => {
    const state = createState();

    expect(state).toMatchObject({
      displayItemIdList: ['a', 'b', 'c'],
      latestExternalItemIdList: ['a', 'b', 'c'],
      isDragging: false,
      dragStartOrder: [],
      suppressNextClick: false,
      shouldRollbackOnEnd: false,
    });

    state.optimisticOrderedIds = ['b', 'a', 'c'];
    state.optimisticBaseOrderedIds = ['a', 'b', 'c'];
    state.optimisticCommitMarker = Symbol('commit');

    clearOptimisticState(state);

    expect(state.optimisticOrderedIds).toBeUndefined();
    expect(state.optimisticBaseOrderedIds).toBeUndefined();
    expect(state.optimisticCommitMarker).toBeUndefined();
  });

  it('resets transient drag fields after a session', () => {
    const state = createState();
    startReorderSurfaceDrag(state, {
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: -1,
      profile: pointerProfile,
    });

    state.suppressNextClick = true;

    resetDragState(state);

    expect(state.isDragging).toBe(false);
    expect(state.draggedId).toBeUndefined();
    expect(state.activeProfile).toBeUndefined();
    expect(state.dragStartOrder).toEqual([]);
    expect(state.shouldRollbackOnEnd).toBe(false);
    expect(state.suppressNextClick).toBe(true);
  });

  it('syncs external state across drag, optimistic confirmation, and stale rollback', () => {
    const draggingState = createState();
    startReorderSurfaceDrag(draggingState, {
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      profile: pointerProfile,
    });

    syncReorderSurfaceExternalItemIdList(draggingState, ['a', 'b', 'c']);
    expect(draggingState.shouldRollbackOnEnd).toBe(false);

    syncReorderSurfaceExternalItemIdList(draggingState, ['b', 'c', 'd']);
    expect(draggingState.shouldRollbackOnEnd).toBe(true);

    const confirmedState = createState();
    confirmedState.optimisticOrderedIds = ['b', 'a', 'c'];
    confirmedState.optimisticBaseOrderedIds = ['a', 'b', 'c'];
    confirmedState.optimisticCommitMarker = Symbol('commit');

    syncReorderSurfaceExternalItemIdList(confirmedState, ['b', 'a', 'c']);

    expect(confirmedState.displayItemIdList).toEqual(['b', 'a', 'c']);
    expect(confirmedState.optimisticOrderedIds).toBeUndefined();

    const staleState = createState();
    staleState.optimisticOrderedIds = ['b', 'a', 'c'];
    staleState.optimisticBaseOrderedIds = ['a', 'b', 'c'];
    staleState.optimisticCommitMarker = Symbol('commit');

    syncReorderSurfaceExternalItemIdList(staleState, ['a', 'b', 'c']);

    expect(staleState.displayItemIdList).toEqual(['a', 'b', 'c']);
    expect(staleState.optimisticOrderedIds).toEqual(['b', 'a', 'c']);

    syncReorderSurfaceExternalItemIdList(staleState, ['c', 'a', 'b']);

    expect(staleState.displayItemIdList).toEqual(['c', 'a', 'b']);
    expect(staleState.optimisticOrderedIds).toBeUndefined();
  });

  it('marks cancellation only while dragging and previews local order', () => {
    const idleState = createState();
    requestReorderSurfaceCancel(idleState);

    expect(idleState.suppressNextClick).toBe(false);

    const draggingState = createState();
    startReorderSurfaceDrag(draggingState, {
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: -1,
      profile: pointerProfile,
    });

    expect(draggingState.suppressNextClick).toBe(false);
    expect(draggingState.draggedId).toBe('a');
    expect(draggingState.activeProfile).toEqual(pointerProfile);
    expect(draggingState.shouldRollbackOnEnd).toBe(true);

    previewReorderSurfaceDrag(draggingState, ['b', 'a', 'c']);
    expect(draggingState.displayItemIdList).toEqual(['b', 'a', 'c']);

    requestReorderSurfaceCancel(draggingState);
    expect(draggingState.suppressNextClick).toBe(true);
    expect(draggingState.shouldRollbackOnEnd).toBe(true);
  });

  it('completes reorder sessions for noop, rollback, and commit outcomes', () => {
    const missingPayloadState = createState();
    const missingResult = completeReorderSurfaceDrag(missingPayloadState, {
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
      currentItemIdList: ['c', 'a', 'b'],
    });

    expect(missingResult).toEqual({ type: 'noop' });
    expect(missingPayloadState.displayItemIdList).toEqual(['c', 'a', 'b']);

    const rollbackState = createState();
    startReorderSurfaceDrag(rollbackState, {
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      profile: pointerProfile,
    });
    requestReorderSurfaceCancel(rollbackState);

    const rollbackResult = completeReorderSurfaceDrag(rollbackState, {
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
      currentItemIdList: ['a', 'b', 'c'],
    });

    expect(rollbackResult).toEqual({ type: 'noop' });
    expect(rollbackState.displayItemIdList).toEqual(['a', 'b', 'c']);

    const differentSetState = createState();
    startReorderSurfaceDrag(differentSetState, {
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      profile: pointerProfile,
    });

    const differentSetResult = completeReorderSurfaceDrag(differentSetState, {
      orderedIds: ['b', 'a', 'x'],
      fromIndex: 0,
      toIndex: 1,
      currentItemIdList: ['a', 'b', 'c'],
    });

    expect(differentSetResult).toEqual({ type: 'noop' });
    expect(differentSetState.displayItemIdList).toEqual(['a', 'b', 'c']);

    const unchangedState = createState();
    startReorderSurfaceDrag(unchangedState, {
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      profile: pointerProfile,
    });

    const unchangedResult = completeReorderSurfaceDrag(unchangedState, {
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      toIndex: 0,
      currentItemIdList: ['a', 'b', 'c'],
    });

    expect(unchangedResult).toEqual({ type: 'noop' });
    expect(unchangedState.displayItemIdList).toEqual(['a', 'b', 'c']);

    const commitState = createState();
    startReorderSurfaceDrag(commitState, {
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      profile: touchProfile,
    });

    const commitResult = completeReorderSurfaceDrag(commitState, {
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
      currentItemIdList: ['a', 'b', 'c'],
    });

    expect(commitResult.type).toBe('commit');
    if (commitResult.type === 'commit') {
      expect(commitResult.payload).toMatchObject({
        orderedIds: ['b', 'a', 'c'],
        movedId: 'a',
        fromIndex: 0,
        toIndex: 1,
        profile: touchProfile,
      });
      expect(commitState.optimisticCommitMarker).toBe(commitResult.commitId);
    }
    expect(commitState.displayItemIdList).toEqual(['b', 'a', 'c']);
    expect(commitState.suppressNextClick).toBe(true);

    const noSuppressionProfile = {
      ...pointerProfile,
      suppressClickAfterDrag: false,
    };
    const noSuppressionState = createState();
    startReorderSurfaceDrag(noSuppressionState, {
      itemId: 'a',
      orderedIds: ['a', 'b', 'c'],
      fromIndex: 0,
      profile: noSuppressionProfile,
    });

    const noSuppressionResult = completeReorderSurfaceDrag(noSuppressionState, {
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
      currentItemIdList: ['a', 'b', 'c'],
    });

    expect(noSuppressionResult.type).toBe('commit');
    expect(noSuppressionState.suppressNextClick).toBe(false);
  });

  it('treats partially missing drag payload as a noop', () => {
    const missingDraggedIdState = createState();
    missingDraggedIdState.activeProfile = pointerProfile;

    const missingDraggedIdResult = completeReorderSurfaceDrag(missingDraggedIdState, {
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
      currentItemIdList: ['c', 'a', 'b'],
    });

    expect(missingDraggedIdResult).toEqual({ type: 'noop' });
    expect(missingDraggedIdState.displayItemIdList).toEqual(['c', 'a', 'b']);

    const missingProfileState = createState();
    missingProfileState.draggedId = 'a';

    const missingProfileResult = completeReorderSurfaceDrag(missingProfileState, {
      orderedIds: ['b', 'a', 'c'],
      fromIndex: 0,
      toIndex: 1,
      currentItemIdList: ['c', 'a', 'b'],
    });

    expect(missingProfileResult).toEqual({ type: 'noop' });
    expect(missingProfileState.displayItemIdList).toEqual(['c', 'a', 'b']);
  });

  it('rolls back only the matching optimistic commit marker', () => {
    const state = createState(['c', 'a', 'b']);
    const commitId = Symbol('commit');

    state.optimisticOrderedIds = ['b', 'a', 'c'];
    state.optimisticBaseOrderedIds = ['a', 'b', 'c'];
    state.optimisticCommitMarker = commitId;

    rollbackReorderSurfaceCommit(state, Symbol('other'));
    expect(state.displayItemIdList).toEqual(['c', 'a', 'b']);
    expect(state.optimisticOrderedIds).toEqual(['b', 'a', 'c']);

    rollbackReorderSurfaceCommit(state, commitId);
    expect(state.displayItemIdList).toEqual(['c', 'a', 'b']);
    expect(state.optimisticOrderedIds).toBeUndefined();
  });

  it('identifies event kinds and haptic usage correctly', () => {
    const pointerEvent = new Event('pointerdown');
    Object.defineProperty(pointerEvent, 'pointerType', {
      value: 'mouse',
      configurable: true,
    });

    const touchEvent = new Event('touchstart');
    Object.defineProperty(touchEvent, 'touches', {
      value: [],
      configurable: true,
    });

    expect(isPointerEvent(pointerEvent)).toBe(true);
    expect(
      isPointerEvent(
        Object.defineProperty(new Event('pointerdown'), 'pointerType', {
          value: 1,
          configurable: true,
        }),
      ),
    ).toBe(false);
    expect(isPointerEvent(new Event('mousedown'))).toBe(false);
    expect(isTouchLikeEvent(touchEvent)).toBe(true);
    expect(
      isTouchLikeEvent(
        Object.defineProperty(new Event('mousedown'), 'touches', {
          value: 1,
          configurable: true,
        }),
      ),
    ).toBe(false);
    expect(
      isTouchLikeEvent(
        Object.defineProperty(new Event('mousedown'), 'touches', {
          value: [],
          configurable: true,
        }),
      ),
    ).toBe(true);
    expect(isTouchLikeEvent(new Event('mousedown'))).toBe(false);
    expect(isMouseLikeEvent(new MouseEvent('mousedown'))).toBe(true);
    expect(isMouseLikeEvent(new Event('pointerdown'))).toBe(false);
    expect(shouldUseBestEffortReorderHaptics('touch')).toBe(true);
    expect(shouldUseBestEffortReorderHaptics('pointer')).toBe(false);
  });

  it('cleans selection and blurs only focused elements inside the surface', () => {
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const range = document.createRange();
    range.selectNode(document.body);
    selection.removeAllRanges();
    selection.addRange(range);
    const removeAllRangesSpy = vi.spyOn(selection, 'removeAllRanges');

    const container = document.createElement('div');
    const inside = document.createElement('button');
    const outside = document.createElement('button');
    container.appendChild(inside);
    document.body.append(container, outside);

    const insideBlur = vi.spyOn(inside, 'blur');
    inside.focus();
    cleanupPostDragInteraction(container);
    expect(removeAllRangesSpy).toHaveBeenCalled();
    expect(insideBlur).toHaveBeenCalled();

    const outsideBlur = vi.spyOn(outside, 'blur');
    outside.focus();
    cleanupPostDragInteraction(container);
    expect(outsideBlur).not.toHaveBeenCalled();
  });

  it('does not blur focused elements when there is no container', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    const outsideBlur = vi.spyOn(outside, 'blur');

    outside.focus();

    expect(() => {
      cleanupPostDragInteraction(null);
    }).not.toThrow();
    expect(outsideBlur).not.toHaveBeenCalled();
  });

  it('keeps document selection suppression active until the last token releases', () => {
    const firstRelease = acquireReorderDocumentSelectionSuppression();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    const secondRelease = acquireReorderDocumentSelectionSuppression();
    firstRelease();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    secondRelease();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);
  });

  it('prevents document selectstart while suppression is active', () => {
    const release = acquireReorderDocumentSelectionSuppression();
    const activeEvent = new Event('selectstart', {
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(activeEvent);
    expect(activeEvent.defaultPrevented).toBe(true);

    release();

    const releasedEvent = new Event('selectstart', {
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(releasedEvent);
    expect(releasedEvent.defaultPrevented).toBe(false);
  });

  it('clears an existing document selection immediately when suppression is acquired', () => {
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const range = document.createRange();
    range.selectNode(document.body);
    selection.removeAllRanges();
    selection.addRange(range);

    expect(selection.rangeCount).toBeGreaterThan(0);

    const release = acquireReorderDocumentSelectionSuppression();

    expect(selection.rangeCount).toBe(0);

    release();
  });

  it('clears newly created selection on repeated/nested acquisition without losing reference counting', () => {
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const firstRelease = acquireReorderDocumentSelectionSuppression();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    const range = document.createRange();
    range.selectNode(document.body);
    selection.removeAllRanges();
    selection.addRange(range);
    expect(selection.rangeCount).toBe(0);

    const secondRelease = acquireReorderDocumentSelectionSuppression();

    expect(selection.rangeCount).toBe(0);
    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    firstRelease();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    secondRelease();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);
  });

  it('clears a selection created after acquisition while suppression is active', () => {
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const release = acquireReorderDocumentSelectionSuppression();

    const range = document.createRange();
    range.selectNode(document.body);
    selection.addRange(range);

    document.dispatchEvent(new Event('selectionchange'));

    expect(selection.rangeCount).toBe(0);

    release();
  });

  it('clears a selection created during active drag movement without relying on selectionchange', () => {
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const release = acquireReorderDocumentSelectionSuppression();

    const range = document.createRange();
    range.selectNode(document.body);
    selection.addRange(range);

    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    expect(selection.rangeCount).toBe(0);

    release();
  });

  it('cancels the default action of mousemove while suppression is active and clears selection, so the browser never re-creates a selection after this listener runs', () => {
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const release = acquireReorderDocumentSelectionSuppression();

    const range = document.createRange();
    range.selectNode(document.body);
    selection.addRange(range);

    const mouseMoveEvent = new MouseEvent('mousemove', { bubbles: true, cancelable: true });
    document.dispatchEvent(mouseMoveEvent);
    expect(mouseMoveEvent.defaultPrevented).toBe(true);
    expect(selection.rangeCount).toBe(0);

    release();

    const releasedMoveEvent = new MouseEvent('mousemove', { bubbles: true, cancelable: true });
    document.dispatchEvent(releasedMoveEvent);
    expect(releasedMoveEvent.defaultPrevented).toBe(false);
  });

  it('cancels the default action of pointermove with pointerType "mouse" while suppression is active', () => {
    const release = acquireReorderDocumentSelectionSuppression();

    const pointerMoveEvent = createPointerMoveEvent('mouse');
    document.dispatchEvent(pointerMoveEvent);
    expect(pointerMoveEvent.defaultPrevented).toBe(true);

    release();

    const releasedPointerMoveEvent = createPointerMoveEvent('mouse');
    document.dispatchEvent(releasedPointerMoveEvent);
    expect(releasedPointerMoveEvent.defaultPrevented).toBe(false);
  });

  it.each(['touch', 'pen'] as const)(
    'leaves pointermove with pointerType "%s" default-permitted during activation-only suppression, but still clears existing selection',
    (pointerType) => {
      const selection = document.getSelection();

      if (!selection) {
        throw new Error('Selection API is unavailable in the test environment');
      }

      const release = acquireReorderDocumentSelectionSuppression();

      const range = document.createRange();
      range.selectNode(document.body);
      selection.addRange(range);

      const pointerMoveEvent = createPointerMoveEvent(pointerType);
      document.dispatchEvent(pointerMoveEvent);
      expect(pointerMoveEvent.defaultPrevented).toBe(false);
      expect(selection.rangeCount).toBe(0);

      release();
    },
  );

  it('cancels the default action of pointermove with pointerType "touch" once an active reorder drag is confirmed', () => {
    const release = acquireReorderDocumentSelectionSuppression({ suppressTouchMoveDefault: true });

    const pointerMoveEvent = createPointerMoveEvent('touch');
    document.dispatchEvent(pointerMoveEvent);
    expect(pointerMoveEvent.defaultPrevented).toBe(true);

    release();

    const releasedPointerMoveEvent = createPointerMoveEvent('touch');
    document.dispatchEvent(releasedPointerMoveEvent);
    expect(releasedPointerMoveEvent.defaultPrevented).toBe(false);
  });

  it('keeps active-drag pointermove prevention scoped to the token that requested it under nested activation + active-drag acquisition', () => {
    const activationRelease = acquireReorderDocumentSelectionSuppression();
    const dragRelease = acquireReorderDocumentSelectionSuppression({
      suppressTouchMoveDefault: true,
    });

    const pointerMoveEvent = createPointerMoveEvent('touch');
    document.dispatchEvent(pointerMoveEvent);
    expect(pointerMoveEvent.defaultPrevented).toBe(true);

    dragRelease();

    const afterDragReleaseEvent = createPointerMoveEvent('touch');
    document.dispatchEvent(afterDragReleaseEvent);
    expect(afterDragReleaseEvent.defaultPrevented).toBe(false);
    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    activationRelease();
  });

  it('leaves touchmove default-permitted during mere activation, so normal scrolling still works for presses that never become a drag', () => {
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const release = acquireReorderDocumentSelectionSuppression();

    const touchMoveEvent = new Event('touchmove', { bubbles: true, cancelable: true });
    document.dispatchEvent(touchMoveEvent);
    expect(touchMoveEvent.defaultPrevented).toBe(false);

    const range = document.createRange();
    range.selectNode(document.body);
    selection.addRange(range);
    document.dispatchEvent(new Event('touchmove', { bubbles: true, cancelable: true }));
    expect(selection.rangeCount).toBe(0);

    release();
  });

  it('cancels the default action of touchmove once an active reorder drag is confirmed', () => {
    const release = acquireReorderDocumentSelectionSuppression({ suppressTouchMoveDefault: true });

    const touchMoveEvent = new Event('touchmove', { bubbles: true, cancelable: true });
    document.dispatchEvent(touchMoveEvent);
    expect(touchMoveEvent.defaultPrevented).toBe(true);

    release();

    const releasedTouchMoveEvent = new Event('touchmove', { bubbles: true, cancelable: true });
    document.dispatchEvent(releasedTouchMoveEvent);
    expect(releasedTouchMoveEvent.defaultPrevented).toBe(false);
  });

  it('keeps active-drag touchmove prevention scoped to the token that requested it under nested acquisition', () => {
    const activationRelease = acquireReorderDocumentSelectionSuppression();
    const dragRelease = acquireReorderDocumentSelectionSuppression({
      suppressTouchMoveDefault: true,
    });

    const touchMoveEvent = new Event('touchmove', { bubbles: true, cancelable: true });
    document.dispatchEvent(touchMoveEvent);
    expect(touchMoveEvent.defaultPrevented).toBe(true);

    dragRelease();

    const afterDragReleaseEvent = new Event('touchmove', { bubbles: true, cancelable: true });
    document.dispatchEvent(afterDragReleaseEvent);
    expect(afterDragReleaseEvent.defaultPrevented).toBe(false);
    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    activationRelease();
  });

  it('stops clearing selection on selectionchange once suppression is fully released', () => {
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const release = acquireReorderDocumentSelectionSuppression();
    release();

    const range = document.createRange();
    range.selectNode(document.body);
    selection.addRange(range);

    document.dispatchEvent(new Event('selectionchange'));

    expect(selection.rangeCount).toBeGreaterThan(0);

    selection.removeAllRanges();
  });

  it('keeps selectionchange cleanup active after the first release while nested acquisition holds', () => {
    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    const firstRelease = acquireReorderDocumentSelectionSuppression();
    const secondRelease = acquireReorderDocumentSelectionSuppression();

    firstRelease();

    const range = document.createRange();
    range.selectNode(document.body);
    selection.addRange(range);

    document.dispatchEvent(new Event('selectionchange'));

    expect(selection.rangeCount).toBe(0);

    secondRelease();
  });

  it('makes repeated token release harmless', () => {
    const release = acquireReorderDocumentSelectionSuppression();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(true);

    release();
    release();

    expect(
      document.documentElement.classList.contains(REORDER_DOCUMENT_SELECTION_SUPPRESSED_CLASS),
    ).toBe(false);
  });

  it('schedules a single bounded rAF fallback pass that re-clears selection created after a suppressed move event', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    const rafMock = vi.fn((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.stubGlobal('requestAnimationFrame', rafMock);

    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    // jsdom's real Selection.addRange() dispatches selectstart, which our own suppression
    // would block while acquired. Overriding rangeCount directly simulates a selection anchor
    // created through a native path that bypasses selectstart, which is the exact gap this
    // fallback exists for.
    let rangeCount = 0;
    Object.defineProperty(selection, 'rangeCount', {
      configurable: true,
      get: () => rangeCount,
    });
    const removeAllRangesSpy = vi.spyOn(selection, 'removeAllRanges').mockImplementation(() => {
      rangeCount = 0;
    });
    removeAllRangesSpy.mockClear();

    const release = acquireReorderDocumentSelectionSuppression();

    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true }));

    expect(rafMock).toHaveBeenCalledTimes(1);

    rangeCount = 1;
    removeAllRangesSpy.mockClear();

    rafCallbacks[0]?.(0);

    expect(removeAllRangesSpy).toHaveBeenCalled();
    expect(rangeCount).toBe(0);

    release();
    Reflect.deleteProperty(selection, 'rangeCount');
    vi.unstubAllGlobals();
  });

  it('does not re-clear selection through a stale rAF fallback once suppression has fully released', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    const rafMock = vi.fn((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.stubGlobal('requestAnimationFrame', rafMock);

    const selection = document.getSelection();

    if (!selection) {
      throw new Error('Selection API is unavailable in the test environment');
    }

    let rangeCount = 0;
    Object.defineProperty(selection, 'rangeCount', {
      configurable: true,
      get: () => rangeCount,
    });
    const removeAllRangesSpy = vi.spyOn(selection, 'removeAllRanges').mockImplementation(() => {
      rangeCount = 0;
    });

    const release = acquireReorderDocumentSelectionSuppression();

    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true }));
    expect(rafMock).toHaveBeenCalledTimes(1);

    release();

    rangeCount = 1;
    removeAllRangesSpy.mockClear();

    rafCallbacks[0]?.(0);

    expect(removeAllRangesSpy).not.toHaveBeenCalled();
    expect(rangeCount).toBe(1);

    Reflect.deleteProperty(selection, 'rangeCount');
    vi.unstubAllGlobals();
  });

  it('ignores only interactive descendants and ignored subtrees inside reorder items', () => {
    const reorderItem = document.createElement('div');
    reorderItem.setAttribute(REORDER_ITEM_ATTRIBUTE, 'a');
    const button = document.createElement('button');
    const plainSpan = document.createElement('span');
    const ignored = document.createElement('div');
    ignored.setAttribute(REORDER_IGNORE_ATTRIBUTE, '');
    reorderItem.append(button, plainSpan, ignored);
    document.body.appendChild(reorderItem);

    expect(shouldIgnoreTarget(button, 'button')).toBe(true);
    expect(shouldIgnoreTarget(reorderItem, 'div')).toBe(false);
    expect(shouldIgnoreTarget(plainSpan, 'button')).toBe(false);
    expect(shouldIgnoreTarget(ignored, 'button')).toBe(true);
    expect(shouldIgnoreTarget(null, 'button')).toBe(false);
  });
});
