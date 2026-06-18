import { expect, test } from '@playwright/test';
import { openStory } from '../storybook';

test.describe('MDList / visual parity', () => {
  test('MDListItem visual states match baseline', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const surface = page.getByTestId('visual-md-list-states');

    await expect(surface).toHaveScreenshot('md-list-item-states.png');
  });

  test('MDListItem visual states story uses runtime root state classes and shape tokens', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-states');

    const hoverRow = page.locator('[data-state="hover"].md-list-item').first();
    const focusRow = page.locator('[data-state="focus"].md-list-item').first();
    const pressedRow = page.locator('[data-state="pressed"].md-list-item').first();

    await expect(hoverRow).toHaveClass(/md-state_hover/);
    await expect(focusRow).toHaveClass(/md-state_focused/);
    await expect(pressedRow).toHaveClass(/md-state_pressed/);

    const [hoverRadius, focusRadius, pressedRadius] = await Promise.all([
      hoverRow.evaluate((node) => getComputedStyle(node).borderTopLeftRadius),
      focusRow.evaluate((node) => getComputedStyle(node).borderTopLeftRadius),
      pressedRow.evaluate((node) => getComputedStyle(node).borderTopLeftRadius),
    ]);

    expect(
      hoverRadius,
      'forced hover in the visual states story must use the runtime hover shape token on the root list item',
    ).toBe('12px');
    expect(
      focusRadius,
      'forced focus in the visual states story must use the runtime focus shape token on the root list item',
    ).toBe('16px');
    expect(
      pressedRadius,
      'forced pressed in the visual states story must use the runtime pressed shape token on the root list item',
    ).toBe('16px');
  });

  test('MDListItem configurations match baseline', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--configurations');

    const surface = page.getByTestId('visual-md-list-configurations');

    await expect(surface).toHaveScreenshot('md-list-item-configurations.png');
  });

  test('MDListItem interaction states match baseline', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const surface = page.getByTestId('visual-md-list-interaction-states');

    await expect(surface).toHaveScreenshot('md-list-item-interaction-states.png');
  });

  test('MDListItem trailing action layout matches baseline', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--trailing-action-layout');

    const surface = page.getByTestId('visual-md-list-trailing-action');

    await expect(surface).toHaveScreenshot('md-list-item-trailing-action.png');
  });

  test('MDListItem selection modes match baseline', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--selection-modes');

    const surface = page.getByTestId('visual-md-list-selection');

    await expect(surface).toHaveScreenshot('md-list-item-selection.png');
  });

  test('MDListItem surface context standard story matches baseline', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const surface = page.getByTestId('visual-md-list-surface-standard');

    await expect(surface).toHaveScreenshot('md-list-item-surface-context-standard.png');
  });

  test('MDListItem surface context segmented story matches baseline', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-segmented');

    const surface = page.getByTestId('visual-md-list-surface-segmented');

    await expect(surface).toHaveScreenshot('md-list-item-surface-context-segmented.png');
  });

  test('MDListItem segmented diagnostic surface context story matches baseline', async ({
    page,
  }) => {
    await openStory(
      page,
      'material-3-components-lists-mdlistitem--surface-context-segmented-diagnostic',
    );

    const surface = page.getByTestId('visual-md-list-surface-segmented-diagnostic');

    await expect(surface).toHaveScreenshot('md-list-item-surface-context-segmented-diagnostic.png');
  });

  test('MDListItem surface context repository explorer story matches baseline', async ({
    page,
  }) => {
    await openStory(
      page,
      'material-3-components-lists-mdlistitem--surface-context-repository-explorer',
    );

    const surface = page.getByTestId('visual-md-list-surface-repository');

    await expect(surface).toHaveScreenshot('md-list-item-surface-context-repository.png');
  });

  test('MDListItem consumer patterns story matches baseline', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

    const surface = page.getByTestId('visual-md-list-consumer-patterns');

    await expect(surface).toHaveScreenshot('md-list-item-consumer-patterns.png');
  });

  test('MDListItem standalone public API story matches baseline', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const surface = page.getByTestId('visual-md-list-item-standalone');

    await expect(surface).toHaveScreenshot('md-list-item-standalone.png');
  });
});

test.describe('MDList / surface context', () => {
  test('MDList standard items have transparent background inheriting parent surface', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const surface = page.getByTestId('visual-md-list-surface-standard');
    const listItems = surface.locator('.md-list_style_standard .md-list-item').first();
    const bgColor = await listItems.evaluate((node) => getComputedStyle(node).backgroundColor);

    expect(
      bgColor,
      'standard list item background must be transparent to inherit the parent surface color',
    ).toBe('rgba(0, 0, 0, 0)');
  });

  test('MDList standard container has transparent background', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const standardList = page.locator('#surface-context-wrapped-standard .md-list').first();
    const bgColor = await standardList.evaluate((node) => getComputedStyle(node).backgroundColor);

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

  test('MDList resets private item fill variables on its root to block parent leakage', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-standard');

    const wrappedSurface = page.locator('#surface-context-private-var-wrapper');
    const list = wrappedSurface.locator('.md-list').first();
    const item = wrappedSurface.locator('.md-list-item').first();

    const [listPrivateValue, itemColor] = await Promise.all([
      list.evaluate((node) =>
        getComputedStyle(node).getPropertyValue('--md-private-list-item-container-color').trim(),
      ),
      item.evaluate((node) => getComputedStyle(node).backgroundColor),
    ]);

    expect(
      listPrivateValue,
      'MDList must set the private item container color on its own root so parent wrappers cannot override standard list fill by inheritance',
    ).toBe('transparent');
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
    const bgColor = await segmentedList.evaluate((node) => getComputedStyle(node).backgroundColor);

    expect(
      bgColor,
      'M3 segmented list container must be transparent — visual grouping comes from filled items and gaps, not a list-level background plate',
    ).toBe('rgba(0, 0, 0, 0)');
  });

  test('MDList segmented parity story does not wrap MDList in a contrasting diagnostic surface', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-segmented');

    await expect(
      page
        .getByTestId('visual-md-list-surface-segmented')
        .locator('.md-list-item-surface-segmented-diagnostic-story__surface'),
    ).toHaveCount(0);
  });

  test('MDList segmented diagnostic story keeps the contrasting wrapper explicit', async ({
    page,
  }) => {
    await openStory(
      page,
      'material-3-components-lists-mdlistitem--surface-context-segmented-diagnostic',
    );

    const diagnosticSurface = page
      .getByTestId('visual-md-list-surface-segmented-diagnostic')
      .locator('.md-list-item-surface-segmented-diagnostic-story__surface')
      .first();
    const segmentedList = diagnosticSurface.locator('.md-list').first();

    const [surfaceColor, listColor] = await Promise.all([
      diagnosticSurface.evaluate((node) => getComputedStyle(node).backgroundColor),
      segmentedList.evaluate((node) => getComputedStyle(node).backgroundColor),
    ]);

    expect(surfaceColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      listColor,
      'diagnostic wrapper must contrast with a transparent MDList so the story demonstrates parent-surface gap reveal rather than a filled list container',
    ).toBe('rgba(0, 0, 0, 0)');
  });

  test('MDList segmented items own their surface fill via private container color', async ({
    page,
  }) => {
    await openStory(
      page,
      'material-3-components-lists-mdlistitem--surface-context-segmented-diagnostic',
    );

    const segmentedSurface = page
      .getByTestId('visual-md-list-surface-segmented-diagnostic')
      .locator('.md-list-item-surface-segmented-diagnostic-story__surface')
      .first();
    const segmentedItem = page
      .getByTestId('visual-md-list-surface-segmented-diagnostic')
      .locator('.md-list-item')
      .first();

    const [surfaceColor, itemColor] = await Promise.all([
      segmentedSurface.evaluate((node) => getComputedStyle(node).backgroundColor),
      segmentedItem.evaluate((node) => getComputedStyle(node).backgroundColor),
    ]);

    expect(
      itemColor,
      'M3 segmented list items must have a non-transparent fill — the list container has no background, individual items carry the visual surface',
    ).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      itemColor,
      'segmented item fill must differ from the surrounding surface-container-low wrapper and use the Material list item surface color',
    ).not.toBe(surfaceColor);
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

  test('MDList standard list does not add background to Repository Explorer document section', async ({
    page,
  }) => {
    await openStory(
      page,
      'material-3-components-lists-mdlistitem--surface-context-repository-explorer',
    );

    const header = page.locator(
      '#surface-context-repository-documents .md-list-item-surface-repository-story__repo-header',
    );
    const standardList = page.locator('#surface-context-repository-standard-list .md-list').first();

    const [headerColor, listColor] = await Promise.all([
      header.evaluate((node) => getComputedStyle(node).backgroundColor),
      standardList.evaluate((node) => getComputedStyle(node).backgroundColor),
    ]);

    expect(
      headerColor,
      'the Repository Explorer header must remain transparent and inherit the parent section surface',
    ).toBe('rgba(0, 0, 0, 0)');
    expect(
      listColor,
      'the standard document list must be transparent so it inherits the pane surface',
    ).toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('MDList / DOM contract', () => {
  test('MDList DOM contract keeps list semantics and separate action surfaces', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--dom-contract');

    await expect(page.locator('#dom-static-list')).toHaveAttribute('role', 'list');
    await expect(page.locator('#dom-static-item')).toHaveAttribute('role', 'listitem');
    await expect(page.locator('#dom-static-item button')).toHaveCount(0);
    await expect(page.locator('#dom-single-item')).toHaveAttribute('role', 'listitem');
    await expect(page.locator('#dom-single-item .md-list-item__primary-action')).toHaveCount(1);
    await expect(page.locator('#dom-multi-item')).toHaveAttribute('role', 'listitem');
    await expect(page.locator('#dom-multi-item .md-list-item__primary-action')).toHaveCount(1);
    await expect(page.locator('#dom-multi-item .md-list-item__trailing-action')).toHaveCount(1);
    await expect(page.locator('#dom-multi-item button button')).toHaveCount(0);
  });

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
});

test.describe('MDList / interaction ownership', () => {
  test('MDListItem trailing action story avoids nested native buttons', async ({ page }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--trailing-action-layout');

    const nestedButtons = page
      .getByTestId('visual-md-list-trailing-action')
      .locator('button button');

    await expect(nestedButtons).toHaveCount(0);
  });

  test('MDListItem trailing action icon buttons meet the Material 48dp minimum target size', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--trailing-action-layout');

    const surface = page.getByTestId('visual-md-list-trailing-action');
    const targets = surface.locator('.md-list-item__trailing-action .md-icon-button__target');
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

  test('MDListItem multi-action rows keep the trailing action independent from the primary action', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--visual-interaction-states');

    const targetRow = page.getByTestId('md-list-multi-action-independence');
    const primaryAction = targetRow.locator('.md-list-item__primary-action');
    const trailingAction = targetRow.getByRole('button', { name: 'Edit' });
    const primaryCount = page.locator('#md-list-primary-action-count');
    const trailingCount = page.locator('#md-list-trailing-action-count');

    await primaryAction.click();
    await expect(primaryCount).toHaveText('1');
    await expect(trailingCount).toHaveText('0');

    await trailingAction.click();
    await expect(primaryCount).toHaveText('1');
    await expect(trailingCount).toHaveText('1');
  });

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

  test('MDListItem shape-bearing elements transition border-radius for hover exit smoothing', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--surface-context-segmented');

    const row = page
      .getByTestId('visual-md-list-surface-segmented')
      .locator('.md-list-item')
      .first();
    const actionSurface = row.locator('.md-list-item__primary-action');

    const [rowTransition, actionTransition] = await Promise.all([
      row.evaluate((node) => getComputedStyle(node).transitionProperty),
      actionSurface.evaluate((node) => getComputedStyle(node).transitionProperty),
    ]);

    expect(
      rowTransition,
      'segmented row root must transition border-radius so the visible item container does not snap while the hover layer fades out',
    ).toContain('border-radius');
    expect(
      actionTransition,
      'segmented action/body surface must transition border-radius so the state layer and visible surface keep the same effective radius during hover exit',
    ).toContain('border-radius');
  });

  test('MDListItem standalone single-action root element is the interactive button', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--standalone-public-api');

    const row = page.locator('#standalone-single-action-leading .md-list-item').first();
    const tagName = await row.evaluate((node) => node.tagName.toLowerCase());

    expect(
      tagName,
      'standalone single-action MDListItem root must be a button (not a div wrapper with internal button)',
    ).toBe('button');

    const box = await row.boundingBox();
    expect(box, 'standalone single-action button must have a bounding box').not.toBeNull();
    if (box) {
      expect(
        box.height,
        'standalone single-action button must meet minimum item height (56dp = 56px)',
      ).toBeGreaterThanOrEqual(56);
    }
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

test.describe('MDList / selection semantics', () => {
  test('MDList selection uses list-level option semantics and a visible selected indicator', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--selection-modes');

    const surface = page.getByTestId('visual-md-list-selection');
    const listboxes = surface.getByRole('listbox');

    await expect(listboxes).toHaveCount(2);
    await expect(listboxes.nth(0)).not.toHaveAttribute('aria-multiselectable', /true/);
    await expect(listboxes.nth(1)).toHaveAttribute('aria-multiselectable', 'true');

    const selectedOptions = surface.locator('[role="option"][aria-selected="true"]');
    await expect(selectedOptions).toHaveCount(3);
    await expect(
      selectedOptions.locator('.md-list-selection-item__selection-indicator .md-symbol'),
    ).toHaveCount(3);
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

  test('MDListItem Home actions are two-line items without forced three-line layout', async ({
    page,
  }) => {
    await openStory(page, 'material-3-components-lists-mdlistitem--consumer-patterns');

    const homeSection = page.locator('#consumer-home-actions');
    const listItems = homeSection.locator('.md-list-item');
    const items = await listItems.all();

    expect(items.length).toBeGreaterThan(0);

    await Promise.all(
      items.map(async (item) => {
        await expect(item).toHaveClass(/md-list-item_line-count_2/);
        await expect(item).not.toHaveClass(/md-list-item_line-count_3/);
      }),
    );
  });
});
