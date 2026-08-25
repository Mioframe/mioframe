import { expect, test } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/storybook/storybook.testUtils';

test('Navigation Path keeps normal small Button geometry and scrolls long breadcrumbs', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-navigationpath-mdnavigationpath--button-geometry-and-overflow');

  const surface = page.getByTestId('navigation-path-contract');
  const navigation = surface.getByRole('navigation', { name: 'Path' });
  const reference = surface.getByTestId('small-button-reference');
  const segment = navigation.getByRole('button', { name: 'My Drive', exact: true });
  const lastSegment = navigation.getByRole('button', { name: 'Final documents', exact: true });

  const [referenceBox, segmentBox] = await Promise.all([
    reference.boundingBox(),
    segment.boundingBox(),
  ]);
  if (!referenceBox || !segmentBox) {
    throw new Error('Missing Navigation Path Button geometry.');
  }

  expect(await segment.evaluate((element) => Reflect.get(element, 'size'))).toBe('small');
  expect(segmentBox.height).toBeCloseTo(referenceBox.height, 0);
  expect(await segment.evaluate((element) => getComputedStyle(element).borderRadius)).toBe(
    await reference.evaluate((element) => getComputedStyle(element).borderRadius),
  );

  const initialOverflow = await navigation.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    whiteSpace: getComputedStyle(element).whiteSpace,
  }));
  expect(initialOverflow.scrollWidth).toBeGreaterThan(initialOverflow.clientWidth);
  expect(initialOverflow.whiteSpace).toBe('nowrap');

  await navigation.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect.poll(() => navigation.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

  await lastSegment.click();
  await expect(surface.getByTestId('selected-navigation-path')).toHaveText(
    '/My Drive/Long project folder/Research materials/Final documents',
  );
});
