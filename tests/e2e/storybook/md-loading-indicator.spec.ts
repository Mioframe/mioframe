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

  const indicators = page.getByTestId('visual-md-loading-indicator-sizes').getByRole('progressbar');
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

test('MDLoadingIndicator exposes the official primary default and accepts its public color token override', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-loading-indicator-mdloadingindicator--color-contract',
  );

  const indicators = page
    .getByTestId('visual-md-loading-indicator-colors')
    .getByRole('progressbar');

  await expect(indicators.nth(0)).toHaveCSS(
    '--md-comp-loading-indicator-active-indicator-color',
    '#6750a4',
  );
  await expect(indicators.nth(1)).toHaveCSS(
    '--md-comp-loading-indicator-active-indicator-color',
    '#006e1c',
  );
});

test('MDLoadingIndicator keeps its standalone primary presentation inside a legacy Material surface', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--legacy-surface-color-ownership');

  const indicator = page.getByRole('progressbar', { name: 'Surface standalone loading' });
  await expect(indicator).toHaveCSS(
    '--md-comp-loading-indicator-active-indicator-color',
    '#6750a4',
  );
  await expect(page.getByTestId('legacy-surface-text')).toHaveCSS('color', 'rgb(179, 38, 30)');
});

test('MDLoadingIndicator rejects undeclared dynamic host attributes and listeners at the actual rendered custom element', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-loading-indicator-mdloadingindicator--attribute-boundary',
  );

  // The story's undeclared dynamic values (aria-valuenow=63, aria-valuemin=17,
  // aria-valuemax=83) are chosen to differ from any value the renderer sets on
  // its own (observed defaults are aria-valuemin="0", aria-valuemax="100", no
  // aria-valuenow); a rejected forward is proven by these sentinel values never
  // appearing, not merely by attribute absence.
  const indicator = page.getByRole('progressbar', { name: 'Attribute boundary' });
  await expect(indicator).toBeVisible();
  await expect(indicator).not.toHaveAttribute('aria-valuenow', '63');
  await expect(indicator).not.toHaveAttribute('aria-valuemin', '17');
  await expect(indicator).not.toHaveAttribute('aria-valuemax', '83');
  await expect(indicator).not.toHaveAttribute('contained');
  await expect(indicator).not.toHaveAttribute('variant', 'contained');

  // Toggle the undeclared dynamic inputs on: this proves the rejection holds
  // for reactive updates, not merely the initial render.
  await page.getByTestId('toggle-undeclared-attrs').click();

  // The element remains the same named progressbar; an undeclared `role`
  // override never took effect.
  await expect(page.getByRole('progressbar', { name: 'Attribute boundary' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(indicator).not.toHaveAttribute('aria-valuenow', '63');
  await expect(indicator).not.toHaveAttribute('aria-valuemin', '17');
  await expect(indicator).not.toHaveAttribute('aria-valuemax', '83');
  await expect(indicator).not.toHaveAttribute('contained');
  await expect(indicator).not.toHaveAttribute('variant', 'contained');

  // An undeclared listener passed via attrs never attaches to the renderer host.
  await indicator.click({ force: true });
  await expect(page.getByTestId('attribute-boundary-click-count')).toHaveText('0');
});
