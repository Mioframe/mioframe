import { expect, test } from '@playwright/test';
import { openStory } from './storybook.testUtils';

// Small rendering tolerance for direct geometry comparisons: browser layout can
// differ from the requested CSS pixel value by a sub-pixel rounding amount.
const GEOMETRY_TOLERANCE_PX = 0.5;

test('MDLoadingIndicator resolves the progressbar role and accessible purpose label in the browser accessibility tree', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-loading-indicator-mdloadingindicator--default');

  const indicator = page.getByRole('progressbar', { name: 'Loading' });

  await expect(indicator).toBeVisible();
});

test('MDLoadingIndicator public overall size sets the actual custom-element host bounding box', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-loading-indicator-mdloadingindicator--size-matrix');

  const indicators = page
    .getByTestId('visual-md-loading-indicator-sizes')
    .locator('m3e-loading-indicator');
  // Rendered in story order: 24, 32, 40, default 48. Only the public host bounding
  // box is asserted here; shadow DOM internals are not inspected.
  const expectedSizes = [24, 32, 40, 48];
  const boxes = await Promise.all(
    expectedSizes.map((_, index) => indicators.nth(index).boundingBox()),
  );

  boxes.forEach((box, index) => {
    expect(box).not.toBeNull();
    if (box == null) throw new Error(`Missing MDLoadingIndicator bounding box at index ${index}.`);

    const expectedSize = expectedSizes[index];
    expect(Math.abs(box.width - expectedSize)).toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);
    expect(Math.abs(box.height - expectedSize)).toBeLessThanOrEqual(GEOMETRY_TOLERANCE_PX);
  });
});
