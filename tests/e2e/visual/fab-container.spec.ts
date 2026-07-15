import { expect, test } from '@playwright/test';
import { openStory } from './storybook';

test('FabContainer FAB stays anchored to pane bottom after async content loads', async ({
  page,
}) => {
  await openStory(page, 'project-ui-buttons-fabcontainer--pane-anchoring-loading-transition');

  const pane = page.locator('#fab-test-pane');
  const fabSurface = page.locator('.fab-container__surface');

  // Wait for Floating UI to position the FAB surface
  await fabSurface.waitFor({ state: 'attached' });

  const paneBoxBefore = await pane.boundingBox();
  const fabBoxBefore = await fabSurface.boundingBox();

  expect(paneBoxBefore).not.toBeNull();
  expect(fabBoxBefore).not.toBeNull();

  if (!paneBoxBefore || !fabBoxBefore) {
    throw new Error('Missing bounding boxes for FAB pane anchoring test (loading state).');
  }

  // FAB surface bottom should align with the pane container bottom (within 1px rounding)
  expect(fabBoxBefore.y + fabBoxBefore.height).toBeCloseTo(
    paneBoxBefore.y + paneBoxBefore.height,
    0,
  );

  // Record FAB position relative to pane bottom in loading state
  const fabRelativeBottomBefore = paneBoxBefore.y + paneBoxBefore.height - fabBoxBefore.y;

  // Trigger content load: placeholder jumps from 80px loading height to 6 * 48px content height
  await page.click('#fab-load-content');

  // Retry until Floating UI autoUpdate has re-anchored the FAB after the layout shift
  await expect(async () => {
    const paneBox = await pane.boundingBox();
    const fabBox = await fabSurface.boundingBox();
    expect(paneBox).not.toBeNull();
    expect(fabBox).not.toBeNull();
    if (!paneBox || !fabBox) return;
    expect(Math.abs(fabBox.y + fabBox.height - (paneBox.y + paneBox.height))).toBeLessThanOrEqual(
      1,
    );
  }).toPass({ timeout: 2000 });

  const paneBoxAfter = await pane.boundingBox();
  const fabBoxAfter = await fabSurface.boundingBox();

  expect(paneBoxAfter).not.toBeNull();
  expect(fabBoxAfter).not.toBeNull();

  if (!paneBoxAfter || !fabBoxAfter) {
    throw new Error('Missing bounding boxes for FAB pane anchoring test (loaded state).');
  }

  // FAB surface must remain anchored to pane bottom after the layout shift
  expect(fabBoxAfter.y + fabBoxAfter.height).toBeCloseTo(paneBoxAfter.y + paneBoxAfter.height, 0);

  // The FAB's position relative to pane bottom must not change after content loads
  const fabRelativeBottomAfter = paneBoxAfter.y + paneBoxAfter.height - fabBoxAfter.y;
  expect(Math.abs(fabRelativeBottomAfter - fabRelativeBottomBefore)).toBeLessThanOrEqual(1);

  // FAB button must be visible and within the pane bounds
  const fab = page.getByRole('button', { name: 'Add', exact: true });
  const fabButtonBox = await fab.boundingBox();

  expect(fabButtonBox).not.toBeNull();

  if (!fabButtonBox) {
    throw new Error('FAB button not visible after content load.');
  }

  expect(fabButtonBox.y).toBeGreaterThan(paneBoxAfter.y);
  expect(fabButtonBox.y + fabButtonBox.height).toBeLessThanOrEqual(
    paneBoxAfter.y + paneBoxAfter.height + 1,
  );
});

test('FabContainer FAB is anchored to its own pane, not the adjacent pane or viewport', async ({
  page,
}) => {
  await openStory(page, 'project-ui-buttons-fabcontainer--two-pane-layout');

  const leftPane = page.locator('#fab-pane-left');
  const rightPane = page.locator('#fab-pane-right');
  const fabSurface = page.locator('.fab-container__surface');

  await fabSurface.waitFor({ state: 'attached' });

  const leftPaneBox = await leftPane.boundingBox();
  const rightPaneBox = await rightPane.boundingBox();
  const fabBox = await fabSurface.boundingBox();

  expect(leftPaneBox).not.toBeNull();
  expect(rightPaneBox).not.toBeNull();
  expect(fabBox).not.toBeNull();

  if (!leftPaneBox || !rightPaneBox || !fabBox) {
    throw new Error('Missing bounding boxes for FAB two-pane anchoring test.');
  }

  // FAB surface bottom must align with the right pane bottom (the pane that owns the FAB)
  expect(fabBox.y + fabBox.height).toBeCloseTo(rightPaneBox.y + rightPaneBox.height, 0);

  // FAB must be positioned inside the right pane's horizontal bounds
  expect(fabBox.x).toBeGreaterThanOrEqual(rightPaneBox.x);
  expect(fabBox.x + fabBox.width).toBeLessThanOrEqual(rightPaneBox.x + rightPaneBox.width + 1);

  // FAB must not overlap the left pane
  expect(fabBox.x).toBeGreaterThan(leftPaneBox.x + leftPaneBox.width - 1);

  // Trigger async content change in right pane and verify FAB remains anchored
  await page.click('#fab-two-pane-load-content');

  await expect(async () => {
    const rightBox = await rightPane.boundingBox();
    const fabBox2 = await fabSurface.boundingBox();
    expect(rightBox).not.toBeNull();
    expect(fabBox2).not.toBeNull();
    if (!rightBox || !fabBox2) return;
    expect(
      Math.abs(fabBox2.y + fabBox2.height - (rightBox.y + rightBox.height)),
    ).toBeLessThanOrEqual(1);
  }).toPass({ timeout: 2000 });

  // FAB button must remain visible inside right pane bounds after content change
  const fabButton = page.getByRole('button', { name: 'Add', exact: true });
  const fabButtonBox = await fabButton.boundingBox();
  const rightPaneBoxAfter = await rightPane.boundingBox();

  expect(fabButtonBox).not.toBeNull();
  expect(rightPaneBoxAfter).not.toBeNull();

  if (!fabButtonBox || !rightPaneBoxAfter) {
    throw new Error('FAB button or right pane not visible after two-pane content change.');
  }

  expect(fabButtonBox.x).toBeGreaterThanOrEqual(rightPaneBoxAfter.x);
  expect(fabButtonBox.y + fabButtonBox.height).toBeLessThanOrEqual(
    rightPaneBoxAfter.y + rightPaneBoxAfter.height + 1,
  );
});
