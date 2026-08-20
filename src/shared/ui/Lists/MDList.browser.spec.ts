import { expect, test, type Locator } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/storybook/storybook.testUtils';

/**
 * Compact Material Expressive list constants used by the geometry/token assertions below.
 *
 * Source notes:
 * - Primary source of truth: the `material3` MCP server (m3.material.io List
 *   component docs/specs — Lists Overview, Lists Specs, Lists Guidelines).
 *   `contentSpacing.between`/`.leading`/`.trailing` were re-verified against the
 *   literal List Common spec token table (`md.comp.list.list-item.between-space` =
 *   12dp, `.leading-space` = 16dp, `.trailing-space` = 16dp).
 * - Secondary local reference only (not a source of truth for Material
 *   values): src/shared/ui/Lists/README.md.
 *
 * List does not own the global keyboard focus indicator's Material tokens
 * (thickness/offset) — those belong to the existing global focus indicator
 * mechanism and must not be asserted here. See the "keyboard focus indicator
 * integration" suite below for List's boundary-level integration checks only.
 */
const MD_LIST_MATERIAL_CONTRACT = {
  rowHeights: {
    oneLine: 56,
    twoLine: 72,
    threeLine: 88,
  },
  shapes: {
    default: 4,
    hover: 12,
    focused: 16,
    pressed: 16,
    dragged: 16,
    selected: 16,
    segmentedContainer: 16,
    media: 8,
  },
  segmentedGap: 2,
  leadingSizes: {
    avatar: 40,
    media: 56,
    icon: 20,
  },
  trailingIconSize: 20,
  minTrailingActionTarget: 48,
  contentSpacing: {
    block: 10,
    between: 12,
    leading: 16,
    trailing: 16,
  },
  // Percentage form: the canonical `--md-sys-state-*-state-layer-opacity` foundation tokens
  // (src/shared/ui/material/foundation/tokens.css) use `<percentage>`, not a unitless
  // `<number>`, because that representation is valid in every selected consumer's CSS
  // grammar, including m3e's `color-mix()`-based state layer (see component-tokens.md,
  // "Mapping"). Same opacity magnitude as the previous `0.08`/`0.1`/`0.16` values.
  stateLayerOpacity: {
    hover: '8%',
    pressed: '10%',
    dragged: '16%',
  },
  disabledOpacity: 0.38,
} as const;

const getBackgroundColor = async (locator: Locator) =>
  locator.evaluate((node) => getComputedStyle(node).backgroundColor);

const getRadius = async (locator: Locator, property: string) =>
  locator.evaluate(
    (node, requestedProperty) => getComputedStyle(node).getPropertyValue(requestedProperty),
    property,
  );

const getBoundingBoxOrThrow = async (locator: Locator, message: string) => {
  const box = await locator.boundingBox();
  expect(box, message).not.toBeNull();
  if (!box) {
    throw new Error(message);
  }

  return box;
};

const expectClose = (actual: number, expected: number, tolerance: number, message: string) => {
  expect(Math.abs(actual - expected), message).toBeLessThanOrEqual(tolerance);
};

const hasZeroAlpha = (color: string) =>
  color.endsWith('/ 0)') || color === 'rgba(0, 0, 0, 0)' || color === 'transparent';

const normalizeOpacityToken = (value: string) => (value.startsWith('.') ? `0${value}` : value);

// Real native <button>/<a> Enter/Space keyboard activation is a browser default action,
// not something MDListItem implements in JS for non-href rows — happy-dom (the unit-test
// environment) does not reproduce it, so it can only be proven against a real browser
// engine here. Activation is observed through a page-level click listener rather than the
// story's own handlers, so these checks stay independent of any particular story wiring.
test.describe('MDList / keyboard activation', () => {
  const observeClicks = (locator: Locator) =>
    locator.evaluate((node) => {
      node.dataset.clicked = 'false';
      node.addEventListener('click', () => {
        node.dataset.clicked = 'true';
      });
    });

  const wasClicked = (locator: Locator) =>
    locator.evaluate((node) => node.dataset.clicked === 'true');

  test('Enter activates a focused single-action row primary action', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--dom-contract');

    const action = page.locator('#dom-single-item .md-list-item__primary-action');
    await observeClicks(action);
    await action.focus();
    await page.keyboard.press('Enter');

    expect(await wasClicked(action)).toBe(true);
  });

  test('Space activates a focused single-action row primary action', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--dom-contract');

    const action = page.locator('#dom-single-item .md-list-item__primary-action');
    await observeClicks(action);
    await action.focus();
    await page.keyboard.press(' ');

    expect(await wasClicked(action)).toBe(true);
  });

  test('a disabled single-action row primary action is not activated by Enter or Space', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const action = page
      .locator('.md-list-item.md-state_disabled .md-list-item__primary-action')
      .first();
    await observeClicks(action);

    // A native disabled button cannot receive focus, so this also proves the row is
    // unreachable by keyboard traversal, not only unresponsive to the key itself.
    await action.evaluate((node) => {
      node.focus();
    });
    await page.keyboard.press('Enter');
    await page.keyboard.press(' ');

    expect(await wasClicked(action)).toBe(false);
  });

  test('trailing action keyboard activation does not trigger the row primary action', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const row = page.getByTestId('md-list-multi-action-independence');
    const primaryAction = row.locator('.md-list-item__primary-action');
    const trailingButton = row.getByRole('button', { name: 'Edit' });

    await observeClicks(primaryAction);
    await observeClicks(trailingButton);

    await trailingButton.focus();
    await page.keyboard.press('Enter');

    expect(await wasClicked(trailingButton)).toBe(true);
    expect(await wasClicked(primaryAction)).toBe(false);
  });
});

// List does not own the global focus indicator's Material tokens (thickness/offset).
// These tests verify boundary-level integration only: List hands focus to the existing
// global indicator and never paints its own competing focus ring.
test.describe('MDList / keyboard focus indicator integration', () => {
  test('MDListItem pointer focus does not show the global keyboard focus indicator', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const row = page.locator('#standalone-single-action-leading .md-list-item').first();
    const indicator = page.locator('.md-focus-indicator');

    await row.click();
    await expect(indicator).toHaveCSS('opacity', '0');
  });

  // Combined into one test (one story open, one Tab press) since both the global-indicator
  // tracking and the "no local outline" contract are proven from the exact same focused state.
  test('MDListItem keyboard focus uses the global indicator on standalone single-action rows, with no local outline', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const target = page.locator('#standalone-single-action-leading .md-list-item').first();
    const indicator = page.locator('.md-focus-indicator');

    await page.keyboard.press('Tab');
    await expect(target).toBeFocused();
    await expect(indicator).toHaveCSS('opacity', '1');

    // The global indicator transitions top/left/width/height over
    // --md-sys-motion-duration-short2 independently of opacity; wait until its bounding box
    // stops changing between polls so the tracking assertions below aren't racing the
    // in-flight move under CPU-constrained CI containers.
    let previousIndicatorBox = '';
    await expect
      .poll(async () => {
        const box = JSON.stringify(await indicator.boundingBox());
        const isSettled = box === previousIndicatorBox && box !== 'null';
        previousIndicatorBox = box;
        return isSettled;
      })
      .toBe(true);

    const [targetBox, indicatorBox, indicatorRadius, targetRadius, targetOutlineStyle] =
      await Promise.all([
        getBoundingBoxOrThrow(target, 'standalone focused row must have a bounding box'),
        getBoundingBoxOrThrow(indicator, 'focus indicator must have a bounding box'),
        getRadius(indicator, 'border-top-left-radius'),
        getRadius(target, 'border-top-left-radius'),
        target.evaluate((node) => getComputedStyle(node).outlineStyle),
      ]);

    expectClose(indicatorBox.x, targetBox.x, 1, 'focus indicator x must track standalone row');
    expectClose(indicatorBox.y, targetBox.y, 1, 'focus indicator y must track standalone row');
    expectClose(
      indicatorBox.width,
      targetBox.width,
      1,
      'focus indicator width must match standalone row',
    );
    expectClose(
      indicatorBox.height,
      targetBox.height,
      1,
      'focus indicator height must match standalone row',
    );
    expect(indicatorRadius).toBe(targetRadius);
    expect(
      targetOutlineStyle,
      'the focused MDListItem surface itself must not render its own outline — only the shared global .md-focus-indicator may visualize keyboard focus',
    ).toBe('none');
  });

  test('MDListItem standalone multi-action keyboard focus lands on the first action, not the row', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const primaryAction = page
      .locator('#standalone-multi-action .md-list-item__primary-action')
      .first();
    const indicator = page.locator('.md-focus-indicator');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(primaryAction).toBeFocused();
    await expect(indicator).toHaveCSS('opacity', '1');
  });

  test('MDListItem keyboard focus tracks the primary action surface for in-list rows without a second local outline', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const primaryAction = page
      .locator('[data-testid="md-list-multi-action-independence"] .md-list-item__primary-action')
      .first();
    const row = page.locator('[data-testid="md-list-multi-action-independence"]').first();
    const indicator = page.locator('.md-focus-indicator');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(primaryAction).toBeFocused();
    await expect(indicator).toHaveCSS('opacity', '1');

    // The global indicator transitions top/left/width/height over
    // --md-sys-motion-duration-short2 independently of opacity; wait until its bounding box
    // stops changing between polls so the tracking assertions below aren't racing the
    // in-flight move under CPU-constrained CI containers.
    let previousIndicatorBox = '';
    await expect
      .poll(async () => {
        const box = JSON.stringify(await indicator.boundingBox());
        const isSettled = box === previousIndicatorBox && box !== 'null';
        previousIndicatorBox = box;
        return isSettled;
      })
      .toBe(true);

    const [targetBox, indicatorBox, indicatorRadius, targetRadius] = await Promise.all([
      getBoundingBoxOrThrow(primaryAction, 'primary action must have a bounding box'),
      getBoundingBoxOrThrow(indicator, 'focus indicator must have a bounding box'),
      getRadius(indicator, 'border-top-left-radius'),
      getRadius(primaryAction, 'border-top-left-radius'),
    ]);

    expectClose(indicatorBox.x, targetBox.x, 1, 'focus indicator x must track primary action');
    expectClose(indicatorBox.y, targetBox.y, 1, 'focus indicator y must track primary action');
    expectClose(
      indicatorBox.width,
      targetBox.width,
      1,
      'focus indicator width must match primary action',
    );
    expectClose(
      indicatorBox.height,
      targetBox.height,
      1,
      'focus indicator height must match primary action',
    );
    expect(indicatorRadius).toBe(targetRadius);
    expect(targetRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.focused}px`);
    await expect(row).toHaveClass(/md-state_focused/);
  });
});

test.describe('MDList / StateLayer interaction and pointer behavior', () => {
  // The forced `data-visual-state`/Material-reference rows are deterministic visual-gallery
  // fixtures. They prove the state-layer opacity/color tokens render correctly for static
  // snapshot coverage, but must not stand in for runtime `useStateLayer` interaction proof —
  // see the real pointer-driven tests below for that.
  test('MDListItem forced hover/pressed gallery fixtures map to the shared state-layer opacity tokens', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const singleActionRow = page.locator('[data-visual-state="hover"].md-list-item').first();
    const hoverStateLayer = singleActionRow.locator('.md-state-layer').first();
    const pressedRow = page.locator('[data-visual-state="pressed"].md-list-item').first();
    const pressedStateLayer = pressedRow.locator('.md-state-layer').first();

    const [hoverColor, pressedColor, hoverOpacity, pressedOpacity] = await Promise.all([
      hoverStateLayer.evaluate((node) => getComputedStyle(node).backgroundColor),
      pressedStateLayer.evaluate((node) => getComputedStyle(node).backgroundColor),
      hoverStateLayer.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--md-sys-state-hover-state-layer-opacity')
          .trim(),
      ),
      pressedStateLayer.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--md-sys-state-pressed-state-layer-opacity')
          .trim(),
      ),
    ]);

    expect(hoverColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(pressedColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(normalizeOpacityToken(hoverOpacity)).toBe(
      MD_LIST_MATERIAL_CONTRACT.stateLayerOpacity.hover,
    );
    expect(normalizeOpacityToken(pressedOpacity)).toBe(
      MD_LIST_MATERIAL_CONTRACT.stateLayerOpacity.pressed,
    );
  });

  test('MDListItem real pointer hover activates the shared primary-action state layer', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const row = page.getByTestId('md-list-multi-action-independence');
    const primaryAction = row.locator('.md-list-item__primary-action');
    const primaryStateLayer = primaryAction.locator('.md-state-layer').first();

    const beforeColor = await primaryStateLayer.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await primaryAction.hover();

    expect(hasZeroAlpha(beforeColor), 'state layer must be inactive before pointer hover').toBe(
      true,
    );
    // MDStateLayer's background-color transitions over
    // --md-sys-motion-duration-short4 (~0.2s); poll instead of a single immediate read so this
    // assertion isn't racing the in-flight transition under CPU-constrained CI containers.
    await expect
      .poll(
        async () =>
          hasZeroAlpha(
            await primaryStateLayer.evaluate((node) => getComputedStyle(node).backgroundColor),
          ),
        {
          message:
            'real pointer hover must activate the shared MDStateLayer background, not a forced fixture class',
        },
      )
      .toBe(false);
  });

  test('MDListItem real pointer press activates the shared primary-action pressed state layer', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const row = page.getByTestId('md-list-multi-action-independence');
    const primaryAction = row.locator('.md-list-item__primary-action');
    const primaryStateLayer = primaryAction.locator('.md-state-layer').first();
    const box = await getBoundingBoxOrThrow(
      primaryAction,
      'primary action must have a bounding box',
    );

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // MDStateLayer's background-color transitions over
    // --md-sys-motion-duration-short4 (~0.2s); poll while the pointer stays pressed instead of
    // a single immediate read so this assertion isn't racing the in-flight transition under
    // CPU-constrained CI containers.
    await expect
      .poll(
        async () =>
          hasZeroAlpha(
            await primaryStateLayer.evaluate((node) => getComputedStyle(node).backgroundColor),
          ),
        {
          message:
            'real mouse-down press must activate the shared MDStateLayer pressed background, not a forced fixture class',
        },
      )
      .toBe(false);
    await page.mouse.up();
  });

  test('MDListItem real pointer hover on the trailing action does not activate the row primary state layer', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const row = page.getByTestId('md-list-multi-action-independence');
    const primaryStateLayer = row
      .locator('.md-list-item__primary-action > .md-state-layer')
      .first();
    const trailingButton = row.getByRole('button', { name: 'Edit' });
    const trailingStateLayer = trailingButton.locator('.md-state-layer').first();

    await trailingButton.hover();

    // MDStateLayer's background-color transitions over
    // --md-sys-motion-duration-short4 (~0.2s); poll for the trailing activation instead of a
    // single immediate read so this assertion isn't racing the in-flight transition under
    // CPU-constrained CI containers.
    await expect
      .poll(
        async () =>
          hasZeroAlpha(
            await trailingStateLayer.evaluate((node) => getComputedStyle(node).backgroundColor),
          ),
        {
          message:
            'hovering the trailing action must activate its own shared interactive primitive state layer',
        },
      )
      .toBe(false);

    const primaryColor = await primaryStateLayer.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );

    expect(
      hasZeroAlpha(primaryColor),
      'hovering the trailing action must not activate the row primary action state layer',
    ).toBe(true);
  });

  test('MDListSelectionItem real pointer click selects a row and updates its container fill', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--selection-modes');

    const surface = page.getByTestId('visual-md-list-selection');
    const pitaOption = surface.getByRole('option', { name: 'Pita' });

    const beforeSelected = await pitaOption.getAttribute('aria-selected');
    const beforeColor = await pitaOption.evaluate((node) => getComputedStyle(node).backgroundColor);

    await pitaOption.click();

    await expect(pitaOption).toHaveAttribute('aria-selected', 'true');
    const afterColor = await pitaOption.evaluate((node) => getComputedStyle(node).backgroundColor);

    expect(beforeSelected).not.toBe('true');
    expect(
      afterColor,
      'a real pointer click selecting a row must change its container fill to the selected color role',
    ).not.toBe(beforeColor);
  });

  test('MDListItem disabled action rows keep the shared state layer visually inactive', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const disabledRow = page.locator('.md-list-item.md-state_disabled').first();
    const disabledStateLayer = disabledRow.locator('.md-state-layer').first();
    const backgroundColor = await getBackgroundColor(disabledStateLayer);

    expect(hasZeroAlpha(backgroundColor)).toBe(true);
  });

  // The visual-states gallery forces hover/focus/pressed/dragged through
  // MDStateLayerForcedStateProvider (combined with the md-state_* host class for shape) —
  // this proves the forced rows actually activate the real MDStateLayer overlay, not just
  // the shape, so the screenshot visibly distinguishes each state.
  test('MDListItem visual states gallery activates a visible state-layer overlay for hover, focus, pressed, and dragged', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const enabledLayer = page
      .locator('[data-state="enabled"].md-list-item')
      .first()
      .locator('.md-state-layer')
      .first();
    const hoverLayer = page
      .locator('[data-state="hover"].md-list-item')
      .first()
      .locator('.md-state-layer')
      .first();
    const focusLayer = page
      .locator('[data-state="focus"].md-list-item')
      .first()
      .locator('.md-state-layer')
      .first();
    const pressedLayer = page
      .locator('[data-state="pressed"].md-list-item')
      .first()
      .locator('.md-state-layer')
      .first();
    const draggedLayer = page
      .locator('.md-list-item.md-state_dragged')
      .first()
      .locator('.md-state-layer')
      .first();

    const [enabledColor, hoverColor, focusColor, pressedColor, draggedColor] = await Promise.all([
      getBackgroundColor(enabledLayer),
      getBackgroundColor(hoverLayer),
      getBackgroundColor(focusLayer),
      getBackgroundColor(pressedLayer),
      getBackgroundColor(draggedLayer),
    ]);

    expect(hasZeroAlpha(enabledColor), 'default row state layer must be visually inactive').toBe(
      true,
    );
    for (const [name, color] of [
      ['hover', hoverColor],
      ['focus', focusColor],
      ['pressed', pressedColor],
      ['dragged', draggedColor],
    ]) {
      expect(
        hasZeroAlpha(color),
        `forced ${name} row must activate a visible state-layer overlay, not stay inactive`,
      ).toBe(false);
    }
  });

  // The sortable-like row uses the public `dragged` prop directly (the same boundary
  // sortable consumers such as useReorderSurface use), not MDStateLayerForcedStateProvider
  // — this proves the nested MDStateLayer inside the multi-action row's internal
  // primary-action surface actually activates from the prop-based path, closing the gap
  // a forced-state-only fixture cannot prove. (Class presence for `dragged` is already
  // covered by MDListItem.test.ts; this proves the resulting overlay is actually visible.)
  test('MDListItem sortable-like row activates the nested state layer via the public dragged prop', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const draggedRow = page.getByTestId('sortable-like-dragged-row');
    const nestedStateLayer = draggedRow.locator('.md-list-item__primary-action .md-state-layer');

    await expect(draggedRow).toHaveClass(/md-state_dragged/);

    const backgroundColor = await getBackgroundColor(nestedStateLayer);

    expect(
      hasZeroAlpha(backgroundColor),
      'sortable-like dragged row must activate a visible nested state-layer overlay from the public dragged prop',
    ).toBe(false);
  });

  // The interaction-states gallery forces hover/focus/pressed through
  // MDStateLayerForcedStateProvider for both single-action and multi-action rows — this
  // proves the multi-action hover row (where the state layer is nested under
  // .md-list-item__primary-action, not a direct child) also gets a real overlay, which a
  // bare md-state_* host class cannot guarantee through CSS alone.
  test('MDListItem interaction-states gallery activates a visible state-layer overlay for single-action and multi-action rows', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const singleActionHoverLayer = page
      .locator('[data-visual-state="hover"].md-list-item')
      .first()
      .locator('.md-state-layer')
      .first();
    const multiActionHoverLayer = page
      .locator('.md-list-item.md-state_hover')
      .filter({ hasText: 'Primary hover' })
      .first()
      .locator('.md-list-item__primary-action .md-state-layer')
      .first();

    const [singleColor, multiColor] = await Promise.all([
      getBackgroundColor(singleActionHoverLayer),
      getBackgroundColor(multiActionHoverLayer),
    ]);

    expect(
      hasZeroAlpha(singleColor),
      'forced hover on the single-action row must activate a visible state-layer overlay',
    ).toBe(false);
    expect(
      hasZeroAlpha(multiColor),
      'forced hover on the multi-action row must activate a visible state-layer overlay on the nested primary-action state layer',
    ).toBe(false);
  });

  test('MDListItem trailing action icon buttons meet the Material 48dp minimum target size', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--trailing-action-layout');

    const surface = page.getByTestId('visual-md-list-trailing-action');
    const targets = surface.locator('.md-list-item__trailing-action .md-icon-button__target');
    // .count() does not auto-wait for the story to finish rendering, unlike locator
    // assertions/actions; wait for the first target to be visible before counting.
    await expect(targets.first()).toBeVisible();
    const count = await targets.count();

    expect(count).toBeGreaterThan(0);

    const boxes = await Promise.all(
      Array.from({ length: count }, (_, i) => targets.nth(i).boundingBox()),
    );

    for (const [i, box] of boxes.entries()) {
      expect(box, `trailing action target ${i} must have a bounding box`).not.toBeNull();
      if (box) {
        expect(
          box.width,
          `trailing action target ${i} width must be at least 48px (Material min target)`,
        ).toBeGreaterThanOrEqual(48);
        expect(
          box.height,
          `trailing action target ${i} height must be at least 48px (Material min target)`,
        ).toBeGreaterThanOrEqual(48);
      }
    }
  });

  // In JSDOM/happy-dom CSS hit-testing is not simulated (see MDListItem.test.ts, which owns
  // the deterministic click-routing wiring instead), so the real grid-cell overlap plus
  // pointer-events layering (padding falls through to the primary action) can only be
  // proven against a real browser engine here.
  test('MDListItem multi-action trailing padding fires primary action, not trailing', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const targetRow = page.getByTestId('md-list-multi-action-independence');
    const trailingSlot = targetRow.locator('.md-list-item__trailing-action');
    const iconButton = targetRow.getByRole('button', { name: 'Edit' });
    const primaryCount = page.locator('#md-list-primary-action-count');
    const trailingCount = page.locator('#md-list-trailing-action-count');

    const trailingBox = await trailingSlot.boundingBox();
    const iconBox = await iconButton.boundingBox();

    expect(trailingBox, 'trailing slot must have a bounding box').not.toBeNull();
    expect(iconBox, 'trailing icon button must have a bounding box').not.toBeNull();

    if (!trailingBox || !iconBox) {
      throw new Error('Could not get bounding boxes for trailing hit-zone test.');
    }

    expect(
      trailingBox.x + 2,
      'trailing slot must have measurable padding to the left of the icon button (trailing-action padding-inline-start must create a non-interactive gap)',
    ).toBeLessThan(iconBox.x);

    await page.mouse.click(trailingBox.x + 2, trailingBox.y + trailingBox.height / 2);
    await expect(primaryCount).toHaveText('1');
    await expect(trailingCount).toHaveText('0');
  });

  test('MDListItem multi-action primary area hover activates row-level hover state', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const targetRow = page.locator(
      '[data-testid="md-list-multi-action-independence"][role="listitem"]',
    );
    const primaryAction = targetRow.locator('.md-list-item__primary-action');

    await primaryAction.hover();

    await expect(targetRow).toHaveClass(/md-state_hover/);
  });

  test('MDListItem multi-action trailing target hover removes row-level hover state', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const targetRow = page.locator(
      '[data-testid="md-list-multi-action-independence"][role="listitem"]',
    );
    const primaryAction = targetRow.locator('.md-list-item__primary-action');
    const trailingButton = targetRow.getByRole('button', { name: 'Edit' });

    await primaryAction.hover();
    await expect(targetRow).toHaveClass(/md-state_hover/);

    await trailingButton.hover();
    await expect(targetRow).not.toHaveClass(/md-state_hover/);
  });

  test('MDListItem multi-action trailing empty padding hover keeps row-level hover state', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const targetRow = page.locator(
      '[data-testid="md-list-multi-action-independence"][role="listitem"]',
    );
    const trailingSlot = targetRow.locator('.md-list-item__trailing-action');
    const iconButton = targetRow.getByRole('button', { name: 'Edit' });

    const trailingBox = await trailingSlot.boundingBox();
    const iconBox = await iconButton.boundingBox();

    expect(trailingBox, 'trailing slot must have a bounding box').not.toBeNull();
    expect(iconBox, 'trailing icon button must have a bounding box').not.toBeNull();

    if (!trailingBox || !iconBox) {
      throw new Error('Could not get bounding boxes for trailing empty-padding hover test.');
    }

    expect(
      trailingBox.x + 4,
      'trailing slot must have measurable padding to the left of the icon button (at least 4px gap required for hover-ownership test)',
    ).toBeLessThan(iconBox.x);

    await page.mouse.move(trailingBox.x + 2, trailingBox.y + trailingBox.height / 2);

    await expect(targetRow).toHaveClass(/md-state_hover/);
  });

  test('MDListItem deterministic hover story mirrors runtime state placement on the row root', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const singleActionRow = page.locator('[data-visual-state="hover"].md-list-item').first();
    const multiActionRow = page.locator('[data-visual-state="hover"].md-list-item').nth(1);

    await expect(singleActionRow).toHaveClass(/md-state_hover/);
    await expect(multiActionRow).toHaveClass(/md-state_hover/);
    await expect(singleActionRow.locator('.md-list-item__primary-action')).not.toHaveClass(
      /md-state_hover/,
    );
    await expect(multiActionRow.locator('.md-list-item__primary-action')).not.toHaveClass(
      /md-state_hover/,
    );
  });

  test('MDListItem standalone single-action button meets the minimum item height', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const row = page.locator('#standalone-single-action-leading .md-list-item').first();
    const box = await getBoundingBoxOrThrow(
      row,
      'standalone single-action button must have a bounding box',
    );

    expect(
      box.height,
      'standalone single-action button must meet minimum item height (56dp = 56px)',
    ).toBeGreaterThanOrEqual(56);
  });

  test('MDListItem standalone multi-action keeps primary and trailing action separation', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const row = page.locator('#standalone-multi-action .md-list-item').first();
    const trailingSlot = row.locator('.md-list-item__trailing-action');
    const iconButton = trailingSlot.getByRole('button');

    const trailingBox = await trailingSlot.boundingBox();
    const iconBox = await iconButton.boundingBox();

    expect(trailingBox, 'trailing action container must have a bounding box').not.toBeNull();
    expect(iconBox, 'trailing action icon button must have a bounding box').not.toBeNull();

    if (!trailingBox || !iconBox) {
      throw new Error('Could not get bounding boxes for standalone multi-action separation test.');
    }

    expect(
      trailingBox.x,
      'trailing action container must start to the left of the icon button (padding gap required)',
    ).toBeLessThan(iconBox.x);
  });

  test('MDListItem Settings checkbox row does not contain nested interactive controls', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

    const checkboxSection = page.locator('#consumer-settings-checkbox');
    await expect(checkboxSection.locator('input')).toHaveCount(0);
    await expect(checkboxSection.locator('label')).toHaveCount(0);
    await expect(checkboxSection.locator('button button')).toHaveCount(0);
  });

  test('MDListItem disabled Settings checkbox row shows no pointer cursor', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

    const checkboxSection = page.locator('#consumer-settings-checkbox');
    const disabledRow = checkboxSection.locator('.md-list-item.md-state_disabled').first();
    const cursor = await disabledRow.evaluate((node) => getComputedStyle(node).cursor);

    expect(cursor, 'disabled checkbox row must not show pointer cursor').not.toBe('pointer');
  });

  test('MDListItem consumer patterns have no nested native buttons', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

    const surface = page.getByTestId('visual-md-list-consumer-patterns');
    const nestedButtons = surface.locator('button button');

    await expect(nestedButtons).toHaveCount(0);
  });
});

test.describe('MDList / DOM geometry and segmented shape', () => {
  test('MDList segmented style rounds the first and last item wrappers', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--dom-contract');

    const first = page.locator('#dom-segmented-list .md-list-item').first();
    const last = page.locator('#dom-segmented-list .md-list-item').last();

    const firstRadius = await first.evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
    const lastRadius = await last.evaluate(
      (node) => getComputedStyle(node).borderBottomRightRadius,
    );

    expect(firstRadius).toBe('16px');
    expect(lastRadius).toBe('16px');
  });

  test('MDList segmented first-item action surface has top corners rounded without container clipping', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-segmented');

    const firstAction = page
      .getByTestId('visual-md-list-surface-segmented')
      .locator('.md-list-item:first-child .md-list-item__primary-action');

    const topLeftRadius = await firstAction.evaluate(
      (node) => getComputedStyle(node).borderTopLeftRadius,
    );

    expect(
      topLeftRadius,
      'first item action surface must carry its own top-left corner (16px) so state layers are shaped without container clipping',
    ).toBe('16px');
  });

  test('MDList segmented last-item action surface has bottom corners rounded without container clipping', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-segmented');

    const lastAction = page
      .getByTestId('visual-md-list-surface-segmented')
      .locator('.md-list-item:last-child .md-list-item__primary-action');

    const bottomRightRadius = await lastAction.evaluate(
      (node) => getComputedStyle(node).borderBottomRightRadius,
    );

    expect(
      bottomRightRadius,
      'last item action surface must carry its own bottom-right corner (16px) so state layers are shaped without container clipping',
    ).toBe('16px');
  });

  test('MDList segmented container does not use overflow hidden to clip item corners', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-segmented');

    const segmentedList = page
      .getByTestId('visual-md-list-surface-segmented')
      .locator('.md-list')
      .first();
    const overflow = await segmentedList.evaluate((node) => getComputedStyle(node).overflow);

    expect(
      overflow,
      'segmented container must use overflow:clip for visual containment, not overflow:hidden which clips state layers via container instead of action-surface shape',
    ).toBe('clip');
  });
});

// Computed-style/geometry assertions against MD_LIST_MATERIAL_CONTRACT, whose values
// are sourced from the `material3` MCP server (m3.material.io). These check MDList's
// own anatomy elements, not Storybook fixture child CSS. happy-dom does not compute real
// layout/CSS cascade, so these require a real browser engine.
test.describe('MDList / Material Expressive geometry and token contract', () => {
  test('MDListItem one-line, two-line, and three-line rows keep Material minimum heights', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--configurations');

    const rows = page
      .getByTestId('visual-md-list-configurations')
      .locator('.md-list_style_standard .md-list-item');

    const expectedHeights = [
      MD_LIST_MATERIAL_CONTRACT.rowHeights.oneLine,
      MD_LIST_MATERIAL_CONTRACT.rowHeights.twoLine,
      MD_LIST_MATERIAL_CONTRACT.rowHeights.threeLine,
    ];

    const minHeights = await Promise.all(
      expectedHeights.map((_, index) =>
        rows.nth(index).evaluate((node) => getComputedStyle(node).minHeight),
      ),
    );

    for (const [index, expectedHeight] of expectedHeights.entries()) {
      expect(
        minHeights[index],
        `configuration row ${index} must keep the Material min height`,
      ).toBe(`${expectedHeight}px`);
    }
  });

  // Guards against the last segmented configuration row (a multi-line, multi-action,
  // media-leading row) rendering with its last text line pressed against the row's own
  // bottom edge — the row must keep at least the documented 10px block padding below its
  // tallest content (the supporting text), not just satisfy the height floor.
  test('MDList last configuration row keeps Material block padding below its tallest content', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--configurations');

    const lastRow = page
      .getByTestId('visual-md-list-configurations')
      .locator('.md-list_style_segmented .md-list-item')
      .last();
    const supportingText = lastRow.locator('.md-list-item__supporting-text').first();

    const [rowBox, supportingBox] = await Promise.all([
      getBoundingBoxOrThrow(lastRow, 'last configuration row must have a bounding box'),
      getBoundingBoxOrThrow(
        supportingText,
        'last configuration row supporting text must have a bounding box',
      ),
    ]);

    expect(
      rowBox.y + rowBox.height - (supportingBox.y + supportingBox.height),
      'the last configuration row must keep at least the documented block padding below its supporting text, not clip it against the row boundary',
    ).toBeGreaterThanOrEqual(MD_LIST_MATERIAL_CONTRACT.contentSpacing.block - 1);
  });

  test('MDList standard items have transparent background inheriting parent surface', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const surface = page.getByTestId('visual-md-list-surface-standard');
    const listItems = surface.locator('.md-list_style_standard .md-list-item').first();
    const bgColor = await getBackgroundColor(listItems);

    expect(
      bgColor,
      'standard list item background must be transparent to inherit the parent surface color',
    ).toBe('rgba(0, 0, 0, 0)');
  });

  test('MDList standard container has transparent background', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const standardList = page.locator('#surface-context-wrapped-standard .md-list').first();
    const bgColor = await getBackgroundColor(standardList);

    expect(
      bgColor,
      'standard list container must be transparent so wrapper and parent surfaces remain visible',
    ).toBe('rgba(0, 0, 0, 0)');
  });

  test('MDList standard surface context survives intermediate wrappers', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const wrappedSurface = page.locator('#surface-context-wrapped-standard');
    const wrappedItem = wrappedSurface.locator('.md-list-item').first();

    const [surfaceColor, itemColor] = await Promise.all([
      wrappedSurface.evaluate((node) => getComputedStyle(node).backgroundColor),
      wrappedItem.evaluate((node) => getComputedStyle(node).backgroundColor),
    ]);

    expect(surfaceColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      itemColor,
      'intermediate wrappers must not inject a background or break inherited surface context',
    ).toBe('rgba(0, 0, 0, 0)');
  });

  // The wrapper divs around this row exist only to prove surface-color inheritance survives
  // intermediate DOM nesting (see the test above), not to add visual spacing — a previous
  // regression added wrapper padding that made this row render visibly taller than the
  // other one-line rows in this story, which read as a row-height/sizing bug even though
  // MDListItem itself was unaffected.
  test('MDList wrapped standard row is not inflated by intermediate wrapper padding', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const surface = page.getByTestId('visual-md-list-surface-standard');
    const wrappedRow = surface.locator('#surface-context-wrapped-standard .md-list-item').first();
    const plainRow = surface.locator('.md-list-item').first();

    const [wrappedBox, plainBox] = await Promise.all([
      getBoundingBoxOrThrow(wrappedRow, 'wrapped standard row must have a bounding box'),
      getBoundingBoxOrThrow(plainRow, 'plain standard row must have a bounding box'),
    ]);

    expectClose(
      wrappedBox.height,
      plainBox.height,
      1,
      'a one-line row wrapped in intermediate surface-inheritance divs must render at the same height as an unwrapped one-line row, not taller',
    );
  });

  test('MDList standard fixtures keep items contiguous (no accidental segmented gap)', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const surface = page.getByTestId('visual-md-list-surface-standard');
    const rows = surface.locator('.md-list_style_standard .md-list-item');
    const firstBox = await getBoundingBoxOrThrow(
      rows.first(),
      'first standard row must have a bounding box',
    );
    const secondBox = await getBoundingBoxOrThrow(
      rows.nth(1),
      'second standard row must have a bounding box',
    );

    expect(
      secondBox.y - (firstBox.y + firstBox.height),
      'standard list rows must stay contiguous — no segmented-style gap between them',
    ).toBeLessThanOrEqual(0.5);
  });

  // Proves the observable effect only: a wrapper attempting to set the List-owned private
  // container-color variable must not leak into standard MDList item rendering (MDList
  // resets it on its own root). The private variable itself is implementation detail and is
  // not asserted here — only the rendered outcome.
  test('MDList blocks a parent-defined private container-color leak into standard items', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const wrappedSurface = page.locator('#surface-context-private-var-wrapper');
    const item = wrappedSurface.locator('.md-list-item').first();

    const itemColor = await item.evaluate((node) => getComputedStyle(node).backgroundColor);

    expect(
      itemColor,
      'parent-defined private list container color must not leak into standard MDList items',
    ).toBe('rgba(0, 0, 0, 0)');
  });

  test('MDList segmented container is transparent and item fill owns the surface', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-segmented');

    const segmentedList = page
      .getByTestId('visual-md-list-surface-segmented')
      .locator('.md-list')
      .first();
    const bgColor = await getBackgroundColor(segmentedList);

    expect(
      bgColor,
      'M3 segmented list container must be transparent — visual grouping comes from filled items and gaps, not a list-level background plate',
    ).toBe('rgba(0, 0, 0, 0)');

    const item = page
      .getByTestId('visual-md-list-surface-segmented')
      .locator('.md-list-item')
      .first();
    const itemColor = await getBackgroundColor(item);

    expect(
      itemColor,
      'M3 segmented list items must have a non-transparent fill — the list container has no background, individual items carry the visual surface',
    ).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      itemColor,
      'segmented item fill must differ from the surrounding surface-container-low wrapper and use the Material list item surface color',
    ).not.toBe(bgColor);
  });

  test('MDList segmented layout keeps the Material 2px gap and 16px exposed outer shape', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-segmented');

    const surface = page.getByTestId('visual-md-list-surface-segmented');
    const firstItem = surface.locator('.md-list-item').first();
    const secondItem = surface.locator('.md-list-item').nth(1);
    const firstAction = firstItem.locator('.md-list-item__primary-action');

    const [firstBox, secondBox, firstRadius, actionRadius] = await Promise.all([
      getBoundingBoxOrThrow(firstItem, 'first segmented row must have a bounding box'),
      getBoundingBoxOrThrow(secondItem, 'second segmented row must have a bounding box'),
      getRadius(firstItem, 'border-top-left-radius'),
      getRadius(firstAction, 'border-top-left-radius'),
    ]);

    expect(secondBox.y - (firstBox.y + firstBox.height), 'segmented rows must keep a 2px gap').toBe(
      MD_LIST_MATERIAL_CONTRACT.segmentedGap,
    );
    expect(firstRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.segmentedContainer}px`);
    expect(actionRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.segmentedContainer}px`);
  });

  test('MDList expressive states map to 4px default, 12px hover, and 16px focused or pressed shapes', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const enabledRow = page.locator('[data-state="enabled"].md-list-item').first();
    const hoverRow = page.locator('[data-state="hover"].md-list-item').first();
    const focusRow = page.locator('[data-state="focus"].md-list-item').first();
    const pressedRow = page.locator('[data-state="pressed"].md-list-item').first();

    await expect(hoverRow).toHaveClass(/md-state_hover/);
    await expect(focusRow).toHaveClass(/md-state_focused/);
    await expect(pressedRow).toHaveClass(/md-state_pressed/);

    const [enabledRadius, hoverRadius, focusRadius, pressedRadius] = await Promise.all([
      getRadius(enabledRow, 'border-top-left-radius'),
      getRadius(hoverRow, 'border-top-left-radius'),
      getRadius(focusRow, 'border-top-left-radius'),
      getRadius(pressedRow, 'border-top-left-radius'),
    ]);

    expect(enabledRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.default}px`);
    expect(hoverRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.hover}px`);
    expect(focusRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.focused}px`);
    expect(pressedRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.pressed}px`);
  });

  test('MDListItem anatomy keeps expressive avatar, media, and icon sizing (Material contract, not fixture CSS)', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--configurations');

    const surface = page.getByTestId('visual-md-list-configurations');
    // Anatomy-owned wrapper elements (MDListItem leading slot variants), not the
    // fixture's own hardcoded avatar/media child CSS — sizing must come from the
    // component's leading-slot anatomy, with the fixture content only filling it.
    const avatarSlot = surface.locator('.md-list-item__leading_type_avatar').first();
    const mediaSlot = surface.locator('.md-list-item__leading_type_media').first();
    const leadingIcon = surface.locator('.md-list-item__leading .md-symbol').first();
    const trailingIcon = surface.locator('.md-list-item__trailing .md-symbol').first();

    const [avatarBox, mediaBox, mediaRadius, leadingIconSize, trailingIconSize] = await Promise.all(
      [
        getBoundingBoxOrThrow(avatarSlot, 'avatar anatomy slot must have a bounding box'),
        getBoundingBoxOrThrow(mediaSlot, 'media anatomy slot must have a bounding box'),
        getRadius(mediaSlot, 'border-top-left-radius'),
        leadingIcon.evaluate((node) => getComputedStyle(node).fontSize),
        trailingIcon.evaluate((node) => getComputedStyle(node).fontSize),
      ],
    );

    expect(avatarBox.width).toBe(MD_LIST_MATERIAL_CONTRACT.leadingSizes.avatar);
    expect(avatarBox.height).toBe(MD_LIST_MATERIAL_CONTRACT.leadingSizes.avatar);
    expect(mediaBox.width).toBe(MD_LIST_MATERIAL_CONTRACT.leadingSizes.media);
    expect(mediaBox.height).toBe(MD_LIST_MATERIAL_CONTRACT.leadingSizes.media);
    expect(mediaRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.media}px`);
    expect(leadingIconSize).toBe(`${MD_LIST_MATERIAL_CONTRACT.leadingSizes.icon}px`);
    expect(trailingIconSize).toBe(`${MD_LIST_MATERIAL_CONTRACT.trailingIconSize}px`);
  });

  // Anatomy: leading-space/trailing-space are the row's own outer edge padding, applied
  // whether or not a leading/trailing slot is present. between-space is only the gap
  // between actual content slots. A row with neither slot must keep the full 16dp edge
  // padding on both sides, not the 12dp between-space and not a doubled-up value.
  test('MDListItem row without leading or trailing keeps 16dp edge padding on both sides, not between-space', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--configurations');

    const row = page
      .getByTestId('visual-md-list-configurations')
      .locator('.md-list_style_standard .md-list-item')
      .first();
    const body = row.locator('.md-list-item__body, .md-list-item__primary-action').first();

    const [paddingLeft, paddingRight] = await Promise.all([
      body.evaluate((node) => getComputedStyle(node).paddingLeft),
      body.evaluate((node) => getComputedStyle(node).paddingRight),
    ]);

    expect(
      paddingLeft,
      'row body left padding must be leading-space (16dp), not between-space',
    ).toBe(`${MD_LIST_MATERIAL_CONTRACT.contentSpacing.leading}px`);
    expect(
      paddingRight,
      'row body right padding must be trailing-space (16dp), not between-space',
    ).toBe(`${MD_LIST_MATERIAL_CONTRACT.contentSpacing.trailing}px`);
  });

  // The avatar row (segmented configurations, leading avatar + trailing chevron) exercises
  // both edges at once: leading-space from the row edge to the leading slot, between-space
  // from the leading slot to content, between-space from content to trailing, and
  // trailing-space from trailing to the row edge.
  test('MDListItem leading row keeps leading-space at the row edge and between-space to content', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--configurations');

    const row = page
      .getByTestId('visual-md-list-configurations')
      .locator('.md-list-item__leading_type_avatar')
      .first()
      .locator(
        'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " md-list-item ")][1]',
      );
    const leadingSlot = row.locator('.md-list-item__leading');
    const contentSlot = row.locator('.md-list-item__content');

    const [rowBox, leadingBox, contentBox] = await Promise.all([
      getBoundingBoxOrThrow(row, 'leading row must have a bounding box'),
      getBoundingBoxOrThrow(leadingSlot, 'leading anatomy slot must have a bounding box'),
      getBoundingBoxOrThrow(contentSlot, 'content anatomy slot must have a bounding box'),
    ]);

    expectClose(
      leadingBox.x - rowBox.x,
      MD_LIST_MATERIAL_CONTRACT.contentSpacing.leading,
      1,
      'row left edge to leading slot must be leading-space (16dp)',
    );
    expectClose(
      contentBox.x - (leadingBox.x + leadingBox.width),
      MD_LIST_MATERIAL_CONTRACT.contentSpacing.between,
      1,
      'leading-to-content gap must be between-space (12dp), not leading-space',
    );
  });

  // Same avatar row also carries a trailing chevron slot.
  test('MDListItem trailing row keeps between-space to content and trailing-space at the row edge', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--configurations');

    const row = page
      .getByTestId('visual-md-list-configurations')
      .locator('.md-list-item__leading_type_avatar')
      .first()
      .locator(
        'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " md-list-item ")][1]',
      );
    const contentSlot = row.locator('.md-list-item__content');
    const trailingSlot = row.locator('.md-list-item__trailing');

    const [rowBox, contentBox, trailingBox] = await Promise.all([
      getBoundingBoxOrThrow(row, 'trailing row must have a bounding box'),
      getBoundingBoxOrThrow(contentSlot, 'content anatomy slot must have a bounding box'),
      getBoundingBoxOrThrow(trailingSlot, 'trailing anatomy slot must have a bounding box'),
    ]);

    expectClose(
      trailingBox.x - (contentBox.x + contentBox.width),
      MD_LIST_MATERIAL_CONTRACT.contentSpacing.between,
      1,
      'content-to-trailing gap must be between-space (12dp), not trailing-space',
    );
    expectClose(
      rowBox.x + rowBox.width - (trailingBox.x + trailingBox.width),
      MD_LIST_MATERIAL_CONTRACT.contentSpacing.trailing,
      1,
      'trailing slot to row right edge must be trailing-space (16dp)',
    );
  });

  // Multi-action geometry must mirror the same edge model as a passive trailing slot: the
  // 48dp target sits between-space (12dp) from content and trailing-space (16dp) from the
  // row's own right edge, so the reserve on the primary action does not double- or
  // under-count the right edge padding.
  test('MDListItem multi-action trailing target keeps between-space to content and trailing-space at the row edge', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--trailing-action-layout');

    const row = page.getByTestId('visual-md-list-trailing-action').locator('.md-list-item').first();
    const content = row.locator('.md-list-item__content');
    const target = row.locator('.md-list-item__trailing-action .md-icon-button__target');

    const [rowBox, contentBox, targetBox] = await Promise.all([
      getBoundingBoxOrThrow(row, 'multi-action row must have a bounding box'),
      getBoundingBoxOrThrow(content, 'multi-action row content must have a bounding box'),
      getBoundingBoxOrThrow(target, 'trailing action target must have a bounding box'),
    ]);

    expectClose(
      targetBox.x - (contentBox.x + contentBox.width),
      MD_LIST_MATERIAL_CONTRACT.contentSpacing.between,
      1,
      'content to trailing action target must be between-space (12dp)',
    );
    expectClose(
      rowBox.x + rowBox.width - (targetBox.x + targetBox.width),
      MD_LIST_MATERIAL_CONTRACT.contentSpacing.trailing,
      1,
      'trailing action target to row right edge must be trailing-space (16dp), not between-space',
    );
  });

  // Selection rows use the always-present selection indicator as their leading visual slot
  // and must follow the same edge/gap model as MDListItem's leading slot.
  test('MDListSelectionItem selection indicator keeps leading-space at the row edge and between-space to content', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--selection-modes');

    const row = page
      .getByTestId('visual-md-list-selection')
      .locator('.md-list-selection-item')
      .first();
    const indicator = row.locator('.md-list-selection-item__selection-indicator');
    const content = row.locator('.md-list-selection-item__content');

    const [rowBox, indicatorBox, contentBox] = await Promise.all([
      getBoundingBoxOrThrow(row, 'selection row must have a bounding box'),
      getBoundingBoxOrThrow(indicator, 'selection indicator must have a bounding box'),
      getBoundingBoxOrThrow(content, 'selection row content must have a bounding box'),
    ]);

    expectClose(
      indicatorBox.x - rowBox.x,
      MD_LIST_MATERIAL_CONTRACT.contentSpacing.leading,
      1,
      'row left edge to selection indicator must be leading-space (16dp)',
    );
    expectClose(
      contentBox.x - (indicatorBox.x + indicatorBox.width),
      MD_LIST_MATERIAL_CONTRACT.contentSpacing.between,
      1,
      'selection indicator to content gap must be between-space (12dp), not leading-space',
    );
  });

  test('MDList overline, label, and supporting text use the documented typography tokens', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--configurations');

    const surface = page.getByTestId('visual-md-list-configurations');
    const overline = surface.locator('.md-list-item__overline').first();
    const label = surface.locator('.md-list-item__label-text').first();
    const supporting = surface.locator('.md-list-item__supporting-text').first();

    const styles = await Promise.all([
      overline.evaluate((node) => {
        const computed = getComputedStyle(node);
        const root = getComputedStyle(document.documentElement);
        const sample = document.createElement('div');
        sample.style.fontSize = root.getPropertyValue('--md-sys-typescale-label-small-size');
        sample.style.lineHeight = root.getPropertyValue(
          '--md-sys-typescale-label-small-line-height',
        );
        document.body.append(sample);
        const expectedFontSize = getComputedStyle(sample).fontSize;
        const expectedLineHeight = getComputedStyle(sample).lineHeight;
        sample.remove();
        return {
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
          expectedFontSize,
          expectedLineHeight,
        };
      }),
      label.evaluate((node) => {
        const computed = getComputedStyle(node);
        const root = getComputedStyle(document.documentElement);
        const sample = document.createElement('div');
        sample.style.fontSize = root.getPropertyValue('--md-sys-typescale-body-large-size');
        sample.style.lineHeight = root.getPropertyValue(
          '--md-sys-typescale-body-large-line-height',
        );
        document.body.append(sample);
        const expectedFontSize = getComputedStyle(sample).fontSize;
        const expectedLineHeight = getComputedStyle(sample).lineHeight;
        sample.remove();
        return {
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
          expectedFontSize,
          expectedLineHeight,
        };
      }),
      supporting.evaluate((node) => {
        const computed = getComputedStyle(node);
        const root = getComputedStyle(document.documentElement);
        const sample = document.createElement('div');
        sample.style.fontSize = root.getPropertyValue('--md-sys-typescale-body-medium-size');
        sample.style.lineHeight = root.getPropertyValue(
          '--md-sys-typescale-body-medium-line-height',
        );
        document.body.append(sample);
        const expectedFontSize = getComputedStyle(sample).fontSize;
        const expectedLineHeight = getComputedStyle(sample).lineHeight;
        sample.remove();
        return {
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
          expectedFontSize,
          expectedLineHeight,
        };
      }),
    ]);

    for (const [index, entry] of styles.entries()) {
      expect(
        entry.fontSize,
        `typography sample ${index} must match the mapped font-size token`,
      ).toBe(entry.expectedFontSize);
      expect(
        entry.lineHeight,
        `typography sample ${index} must match the mapped line-height token`,
      ).toBe(entry.expectedLineHeight);
    }
  });

  test('MDList content spacing keeps the documented 10px block padding and 48px trailing target', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--trailing-action-layout');

    const row = page.getByTestId('visual-md-list-trailing-action').locator('.md-list-item').first();
    const body = row.locator('.md-list-item__primary-action');
    const trailingTarget = row.locator('.md-list-item__trailing-action .md-icon-button__target');

    const [paddingTop, paddingBottom, targetBox] = await Promise.all([
      body.evaluate((node) => getComputedStyle(node).paddingTop),
      body.evaluate((node) => getComputedStyle(node).paddingBottom),
      getBoundingBoxOrThrow(trailingTarget, 'trailing action target must have a bounding box'),
    ]);

    expect(paddingTop).toBe(`${MD_LIST_MATERIAL_CONTRACT.contentSpacing.block}px`);
    expect(paddingBottom).toBe(`${MD_LIST_MATERIAL_CONTRACT.contentSpacing.block}px`);
    expect(targetBox.width).toBeGreaterThanOrEqual(
      MD_LIST_MATERIAL_CONTRACT.minTrailingActionTarget,
    );
    expect(targetBox.height).toBeGreaterThanOrEqual(
      MD_LIST_MATERIAL_CONTRACT.minTrailingActionTarget,
    );
  });

  test('MDListItem disabled rows expose separate documented opacity tokens for label, leading icon, and trailing icon', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const disabledRow = page.locator('.md-list-item.md-state_disabled').first();

    const [labelOpacity, leadingOpacity, trailingOpacity] = await Promise.all([
      disabledRow.evaluate((node) =>
        getComputedStyle(node)
          .getPropertyValue('--md-comp-list-list-item-disabled-label-text-opacity')
          .trim(),
      ),
      disabledRow.evaluate((node) =>
        getComputedStyle(node)
          .getPropertyValue('--md-comp-list-list-item-disabled-leading-icon-opacity')
          .trim(),
      ),
      disabledRow.evaluate((node) =>
        getComputedStyle(node)
          .getPropertyValue('--md-comp-list-list-item-disabled-trailing-icon-opacity')
          .trim(),
      ),
    ]);

    for (const [name, value] of [
      ['label-text', labelOpacity],
      ['leading-icon', leadingOpacity],
      ['trailing-icon', trailingOpacity],
    ]) {
      expect(
        Number(normalizeOpacityToken(value)),
        `disabled ${name} opacity token must resolve to the documented Material disabled opacity`,
      ).toBeCloseTo(MD_LIST_MATERIAL_CONTRACT.disabledOpacity, 2);
    }
  });

  // Material defines disabled color and disabled opacity as separate component tokens
  // (md.comp.list.list-item.disabled.*.color / .opacity). The public *-color tokens must
  // stay a raw color role (on-surface), not an alpha-composed `rgb(from on-surface ... /
  // opacity)` value — the alpha composition belongs only to the private
  // --md-private-list-item-disabled-*-color implementation variables that the disabled-state
  // remap actually paints with.
  test('MDListItem disabled rows keep public disabled-*-color tokens as raw on-surface, not alpha-composed', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const disabledRow = page.locator('.md-list-item.md-state_disabled').first();

    const [labelTextColor, leadingIconColor, trailingIconColor, supportingTextColor, onSurface] =
      await Promise.all([
        disabledRow.evaluate((node) =>
          getComputedStyle(node)
            .getPropertyValue('--md-comp-list-list-item-disabled-label-text-color')
            .trim(),
        ),
        disabledRow.evaluate((node) =>
          getComputedStyle(node)
            .getPropertyValue('--md-comp-list-list-item-disabled-leading-icon-color')
            .trim(),
        ),
        disabledRow.evaluate((node) =>
          getComputedStyle(node)
            .getPropertyValue('--md-comp-list-list-item-disabled-trailing-icon-color')
            .trim(),
        ),
        disabledRow.evaluate((node) =>
          getComputedStyle(node)
            .getPropertyValue('--md-comp-list-list-item-disabled-supporting-text-color')
            .trim(),
        ),
        disabledRow.evaluate((node) =>
          getComputedStyle(node).getPropertyValue('--md-sys-color-on-surface').trim(),
        ),
      ]);

    for (const [name, value] of [
      ['label-text', labelTextColor],
      ['leading-icon', leadingIconColor],
      ['trailing-icon', trailingIconColor],
      ['supporting-text', supportingTextColor],
    ]) {
      expect(
        value,
        `public disabled ${name} color token must not bake in an alpha channel`,
      ).not.toMatch(/^rgb\(\s*from/);
      expect(
        value,
        `public disabled ${name} color token must equal the raw md.sys.color.on-surface role`,
      ).toBe(onSurface);
    }
  });

  // Unselected disabled list items have no documented `md.comp.list.list-item.disabled.container.*`
  // token (Material only dims the container for the selected/disabled state) — the container
  // must keep whatever color the enabled row already resolves (transparent for standard,
  // the segmented surface fill for segmented), not a darkened on-surface overlay.
  test('MDListItem unselected disabled row keeps its enabled container color, not a darkened overlay', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const enabledRow = page.locator('[data-state="enabled"].md-list-item').first();
    const disabledRow = page.locator('.md-list-item.md-state_disabled').first();

    const [enabledColor, disabledColor] = await Promise.all([
      getBackgroundColor(enabledRow),
      getBackgroundColor(disabledRow),
    ]);

    expect(
      disabledColor,
      'unselected disabled row container color must match the enabled row container color',
    ).toBe(enabledColor);
  });

  // Real MDStateLayer forced-state rows and shape modifiers together represent the
  // documented default/hover/focused/pressed/dragged expressive shape progression, plus
  // the disabled row's shape/overlay contract. Combined into one test (one story open)
  // since both assertions read the same "Material reference states" fixture rows.
  test('MDList Material reference states rows map to the documented expressive shapes, including disabled', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--material-reference');

    const surface = page.getByTestId('visual-md-list-material-states');
    const rows = surface.locator('.md-list-item');
    const disabledRow = surface.locator('.md-list-item.md-state_disabled').first();

    const [
      defaultRadius,
      hoverRadius,
      focusRadius,
      pressedRadius,
      draggedRadius,
      disabledRadius,
      disabledStateLayerColor,
    ] = await Promise.all([
      getRadius(rows.nth(0), 'border-top-left-radius'),
      getRadius(rows.nth(1), 'border-top-left-radius'),
      getRadius(rows.nth(2), 'border-top-left-radius'),
      getRadius(rows.nth(3), 'border-top-left-radius'),
      getRadius(rows.nth(4), 'border-top-left-radius'),
      getRadius(disabledRow, 'border-top-left-radius'),
      disabledRow
        .locator('.md-state-layer')
        .first()
        .evaluate((node) => getComputedStyle(node).backgroundColor),
    ]);

    expect(defaultRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.default}px`);
    expect(hoverRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.hover}px`);
    expect(focusRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.focused}px`);
    expect(pressedRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.pressed}px`);
    expect(draggedRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.dragged}px`);
    expect(disabledRadius).toBe(`${MD_LIST_MATERIAL_CONTRACT.shapes.default}px`);
    expect(
      hasZeroAlpha(disabledStateLayerColor),
      'disabled row must not show an active interactive overlay',
    ).toBe(true);
  });

  // Dragged keeps its resting container color and only gains elevation/shape/content-color
  // remaps, per the documented md.comp.list.list-item.dragged.* List Common spec (verified
  // via the material3 MCP cache): there is no dragged.container.color token. These checks
  // resolve the expected colors from the live system tokens (via a throwaway sample
  // element) so the assertions hold in both light and dark themes instead of hardcoding a
  // hex value. Combined into one test (one story open) since every assertion reads the
  // same dragged row from the same fixture.
  test('MDList Material reference dragged row keeps its resting container color, on-surface content, dragged overlay, and elevation', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--material-reference');

    const surface = page.getByTestId('visual-md-list-material-states');
    const draggedRow = surface.locator('.md-list-item.md-state_dragged').first();
    const restingRow = surface.locator('.md-list-item').first();
    const label = draggedRow.locator('.md-list-item__label-text').first();
    const stateLayer = draggedRow.locator('.md-state-layer').first();

    const [
      draggedBackground,
      restingBackground,
      labelColor,
      expectedContentColor,
      overlayColor,
      expectedOverlayColor,
      boxShadow,
      expectedBoxShadow,
    ] = await Promise.all([
      draggedRow.evaluate((node) => getComputedStyle(node).backgroundColor),
      restingRow.evaluate((node) => getComputedStyle(node).backgroundColor),
      label.evaluate((node) => getComputedStyle(node).color),
      draggedRow.evaluate((node) => {
        const sample = document.createElement('div');
        sample.style.color = getComputedStyle(node).getPropertyValue('--md-sys-color-on-surface');
        document.body.append(sample);
        const resolved = getComputedStyle(sample).color;
        sample.remove();
        return resolved;
      }),
      stateLayer.evaluate((node) => getComputedStyle(node).backgroundColor),
      draggedRow.evaluate((node) => {
        const onSurface = getComputedStyle(node).getPropertyValue('--md-sys-color-on-surface');
        const sample = document.createElement('div');
        sample.style.backgroundColor = `rgb(from ${onSurface} r g b / 0.16)`;
        document.body.append(sample);
        const resolved = getComputedStyle(sample).backgroundColor;
        sample.remove();
        return resolved;
      }),
      draggedRow.evaluate((node) => getComputedStyle(node).boxShadow),
      draggedRow.evaluate((node) => {
        const level4 = getComputedStyle(node).getPropertyValue('--md-sys-elevation-level4');
        const sample = document.createElement('div');
        sample.style.boxShadow = level4;
        document.body.append(sample);
        const resolved = getComputedStyle(sample).boxShadow;
        sample.remove();
        return resolved;
      }),
    ]);

    expect(
      draggedBackground,
      'dragged row container color must match the resting row container color (no documented dragged.container.color token)',
    ).toBe(restingBackground);
    expect(labelColor, 'dragged row label text must resolve to md.sys.color.on-surface').toBe(
      expectedContentColor,
    );
    expect(
      overlayColor,
      'dragged row overlay must resolve to on-surface at the documented 0.16 dragged opacity',
    ).toBe(expectedOverlayColor);
    expect(boxShadow, 'dragged row must render an elevated drag shadow').not.toBe('none');
    expect(
      boxShadow,
      'dragged row elevation must resolve to the documented md.comp.list.list-item.dragged.container.elevation (Material Elevation 4)',
    ).toBe(expectedBoxShadow);
  });
});

test.describe('MDList / sizing and overflow', () => {
  test('MDListSelectionItem long text does not overflow the list container', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--selection-modes');

    const surface = page.getByTestId('visual-md-list-selection');
    const surfaceBox = await surface.boundingBox();

    expect(surfaceBox, 'selection surface must have a bounding box').not.toBeNull();
    if (!surfaceBox) {
      throw new Error('Could not get bounding box for selection surface.');
    }

    const longTextItem = surface
      .getByRole('option')
      .filter({ hasText: /Very long document title/ });
    const itemBox = await longTextItem.boundingBox();

    expect(itemBox, 'long-text item must have a bounding box').not.toBeNull();
    if (!itemBox) {
      throw new Error('Could not get bounding box for long-text selection item.');
    }

    expect(
      itemBox.x + itemBox.width,
      'long-text item right edge must not exceed the selection surface right edge',
    ).toBeLessThanOrEqual(surfaceBox.x + surfaceBox.width + 1);

    const indicator = longTextItem.locator('.md-list-selection-item__selection-indicator');
    const indicatorBox = await indicator.boundingBox();

    expect(indicatorBox, 'selection indicator must have a bounding box').not.toBeNull();
    if (!indicatorBox) {
      throw new Error('Could not get bounding box for selection indicator.');
    }

    expect(
      indicatorBox.x,
      'selection indicator must be inside the surface left edge',
    ).toBeGreaterThanOrEqual(surfaceBox.x);
    expect(
      indicatorBox.x + indicatorBox.width,
      'selection indicator must not exceed the surface right edge',
    ).toBeLessThanOrEqual(surfaceBox.x + surfaceBox.width + 1);
  });

  test('MDListItem standalone basic gallery fully contains every visible section', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const root = page.getByTestId('visual-md-list-item-standalone-basic');

    const [rootBox, scrollWidth, clientWidth] = await Promise.all([
      getBoundingBoxOrThrow(root, 'standalone basic gallery root must have a bounding box'),
      root.evaluate((node) => node.scrollWidth),
      root.evaluate((node) => node.clientWidth),
    ]);

    expect(
      scrollWidth,
      'standalone basic gallery root must not have horizontal overflow (scrollWidth must match clientWidth)',
    ).toBeLessThanOrEqual(clientWidth);
    expect(
      rootBox.width,
      'standalone basic gallery root must not be wider than the visual viewport',
    ).toBeLessThanOrEqual(1280);

    const sections = root.locator('.md-list-item-standalone-story__section');
    const count = await sections.count();
    expect(count, 'standalone basic gallery must render its sections').toBeGreaterThan(0);

    const sectionBoxes = await Promise.all(
      Array.from({ length: count }, (_, index) => sections.nth(index).boundingBox()),
    );

    for (const [index, sectionBox] of sectionBoxes.entries()) {
      expect(
        sectionBox,
        `standalone basic section ${index} must have a bounding box`,
      ).not.toBeNull();
      if (!sectionBox) {
        continue;
      }

      expect(
        sectionBox.x,
        `standalone basic section ${index} must not start left of the gallery root`,
      ).toBeGreaterThanOrEqual(rootBox.x - 1);
      expect(
        sectionBox.x + sectionBox.width,
        `standalone basic section ${index} must not extend past the gallery root right edge`,
      ).toBeLessThanOrEqual(rootBox.x + rootBox.width + 1);
      expect(
        sectionBox.y,
        `standalone basic section ${index} must not start above the gallery root`,
      ).toBeGreaterThanOrEqual(rootBox.y - 1);
      expect(
        sectionBox.y + sectionBox.height,
        `standalone basic section ${index} must not extend past the gallery root bottom edge`,
      ).toBeLessThanOrEqual(rootBox.y + rootBox.height + 1);
    }

    const lastSectionBox = sectionBoxes.at(-1);
    expect(
      lastSectionBox,
      'the last standalone basic section must have a bounding box',
    ).not.toBeNull();
    if (lastSectionBox) {
      expect(
        lastSectionBox.y + lastSectionBox.height,
        'the last standalone basic section must be fully inside the gallery root bounding box, not clipped off the bottom',
      ).toBeLessThanOrEqual(rootBox.y + rootBox.height + 1);
    }
  });

  test('MDListItem standalone consumer rows gallery fully contains its section', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const root = page.getByTestId('visual-md-list-item-standalone-consumer');

    const [rootBox, scrollWidth, clientWidth] = await Promise.all([
      getBoundingBoxOrThrow(root, 'standalone consumer gallery root must have a bounding box'),
      root.evaluate((node) => node.scrollWidth),
      root.evaluate((node) => node.clientWidth),
    ]);

    expect(
      scrollWidth,
      'standalone consumer gallery root must not have horizontal overflow (scrollWidth must match clientWidth)',
    ).toBeLessThanOrEqual(clientWidth);
    expect(
      rootBox.width,
      'standalone consumer gallery root must not be wider than the visual viewport',
    ).toBeLessThanOrEqual(1280);
    expect(
      rootBox.height,
      'standalone consumer gallery root must not be taller than the visual viewport',
    ).toBeLessThanOrEqual(900);

    const rows = root.locator('#standalone-entry-add-sheet .md-list-item');
    const rowCount = await rows.count();
    expect(rowCount, 'standalone consumer gallery must render its rows').toBeGreaterThan(0);

    const rowBoxes = await Promise.all(
      Array.from({ length: rowCount }, (_, index) => rows.nth(index).boundingBox()),
    );

    for (const [index, rowBox] of rowBoxes.entries()) {
      expect(rowBox, `standalone consumer row ${index} must have a bounding box`).not.toBeNull();
      if (!rowBox) {
        continue;
      }

      expect(
        rowBox.x + rowBox.width,
        `standalone consumer row ${index} must not extend past the gallery root right edge`,
      ).toBeLessThanOrEqual(rootBox.x + rootBox.width + 1);
      expect(
        rowBox.y + rowBox.height,
        `standalone consumer row ${index} must not extend past the gallery root bottom edge`,
      ).toBeLessThanOrEqual(rootBox.y + rootBox.height + 1);
    }

    const lastRowBox = rowBoxes.at(-1);
    expect(lastRowBox, 'the last standalone consumer row must have a bounding box').not.toBeNull();
    if (lastRowBox) {
      expect(
        lastRowBox.y + lastRowBox.height,
        'the last standalone consumer row must be fully inside the gallery root bounding box, not clipped off the bottom',
      ).toBeLessThanOrEqual(rootBox.y + rootBox.height + 1);
    }
  });

  test('MDListItem standalone with leading icon has measurable space between icon and content', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const row = page.locator('#standalone-static-leading .md-list-item').first();
    const leading = row.locator('.md-list-item__leading').first();
    const content = row.locator('.md-list-item__content').first();

    const leadingBox = await leading.boundingBox();
    const contentBox = await content.boundingBox();

    expect(leadingBox, 'leading slot must have a bounding box').not.toBeNull();
    expect(contentBox, 'content slot must have a bounding box').not.toBeNull();

    if (!leadingBox || !contentBox) {
      throw new Error('Could not get bounding boxes for standalone leading/content gap test.');
    }

    const gap = contentBox.x - (leadingBox.x + leadingBox.width);

    expect(
      gap,
      'standalone MDListItem must have measurable space (>= 8px) between leading icon and content — gap of 0 means anatomy vars were not resolved',
    ).toBeGreaterThanOrEqual(8);
  });

  test('MDListItem standalone content column does not overlap leading slot', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const row = page.locator('#standalone-static-leading .md-list-item').first();
    const leading = row.locator('.md-list-item__leading').first();
    const content = row.locator('.md-list-item__content').first();

    const leadingBox = await leading.boundingBox();
    const contentBox = await content.boundingBox();

    expect(leadingBox, 'leading slot must have a bounding box').not.toBeNull();
    expect(contentBox, 'content slot must have a bounding box').not.toBeNull();

    if (!leadingBox || !contentBox) {
      throw new Error('Could not get bounding boxes for standalone overlap test.');
    }

    expect(
      contentBox.x,
      'standalone MDListItem content must start to the right of the leading slot right edge',
    ).toBeGreaterThan(leadingBox.x + leadingBox.width);
  });

  test('MDListItem EntryAddSheet consumer rows have correct leading icon spacing', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const rows = page.locator('#standalone-entry-add-sheet .md-list-item');
    // .count() does not auto-wait for the story to finish rendering, unlike locator
    // assertions/actions; wait for the first row to be visible before counting.
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();

    expect(count).toBeGreaterThan(0);

    const boxPairs = await Promise.all(
      Array.from({ length: count }, (_, i) => {
        const row = rows.nth(i);
        return Promise.all([
          row.locator('.md-list-item__leading').boundingBox(),
          row.locator('.md-list-item__content').boundingBox(),
        ]);
      }),
    );

    for (const [i, [leadingBox, contentBox]] of boxPairs.entries()) {
      if (!leadingBox || !contentBox) {
        throw new Error(`Row ${i}: could not get bounding boxes for EntryAddSheet spacing test.`);
      }

      expect(
        contentBox.x,
        `EntryAddSheet row ${i}: content must start to the right of the leading icon right edge — no overlap allowed`,
      ).toBeGreaterThan(leadingBox.x + leadingBox.width);
    }
  });
});

// Geometry guard, independent of pixel snapshots: a row that escapes its visual surface
// can still pass a stale/updated screenshot baseline if the baseline was captured while
// already broken. These assertions fail on horizontal overflow before any snapshot
// comparison runs, for every story that previously regressed when list-item text lost
// its width containment.
test.describe('MDList / row overflow containment', () => {
  const overflowGuardSurfaces = [
    {
      storyId: 'material-3-components-lists-mdlistitem--configurations',
      testId: 'visual-md-list-configurations',
    },
    {
      storyId: 'material-3-components-lists-mdlistitem--consumer-patterns',
      testId: 'visual-md-list-consumer-patterns',
    },
    {
      storyId: 'material-3-components-lists-mdlistitem--visual-interaction-states',
      testId: 'visual-md-list-interaction-states',
    },
    {
      storyId: 'material-3-components-lists-mdlistitem--visual-states',
      testId: 'visual-md-list-states',
    },
    {
      storyId: 'material-3-components-lists-mdlistitem--surface-context-segmented-diagnostic',
      testId: 'visual-md-list-surface-segmented-diagnostic',
    },
    {
      storyId: 'material-3-components-lists-mdlistitem--surface-context-standard',
      testId: 'visual-md-list-surface-standard',
    },
  ];

  const tolerancePx = 1;

  for (const { storyId, testId } of overflowGuardSurfaces) {
    test(`${testId} keeps every row inside the surface bounds`, async ({ page }) => {
      await openStory(page, storyId);

      const surface = page.getByTestId(testId);
      const surfaceBox = await getBoundingBoxOrThrow(surface, `${testId} has no bounding box`);

      const rows = surface.locator('.md-list-item, .md-list-selection-item');
      const rowCount = await rows.count();
      expect(rowCount, `${testId} must render at least one row`).toBeGreaterThan(0);

      const rowBoxes = await Promise.all(
        Array.from({ length: rowCount }, (_unused, index) =>
          getBoundingBoxOrThrow(rows.nth(index), `${testId} row ${index} has no bounding box`),
        ),
      );

      rowBoxes.forEach((rowBox, index) => {
        expect(
          rowBox.x,
          `${testId} row ${index} must not start left of the surface`,
        ).toBeGreaterThanOrEqual(surfaceBox.x - tolerancePx);
        expect(
          rowBox.x + rowBox.width,
          `${testId} row ${index} must not extend right of the surface`,
        ).toBeLessThanOrEqual(surfaceBox.x + surfaceBox.width + tolerancePx);
      });

      const surfaceOverflow = await surface.evaluate((node) => ({
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
      }));
      expect(
        surfaceOverflow.scrollWidth,
        `${testId} content must not scroll wider than the surface`,
      ).toBeLessThanOrEqual(surfaceOverflow.clientWidth + tolerancePx);
    });
  }
});
