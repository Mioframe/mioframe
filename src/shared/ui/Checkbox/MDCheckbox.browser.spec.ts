import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { openStory } from '../../../../tests/e2e/storybook/storybook.testUtils';

// MDCheckbox's native `<input>` has `pointer-events: none` (the visible `<label>` owns click
// handling instead), so the public interaction surface a real user activates is the label, not
// the input itself — click through its bounding box center rather than the role locator.
const clickCheckboxLabel = async (page: Page, checkbox: Locator) => {
  const label = checkbox.locator('xpath=ancestor::label[1]');
  const box = await label.boundingBox();

  if (!box) {
    throw new Error('Missing MDCheckbox label geometry.');
  }

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};

test('MDCheckbox Default story round-trips checked state through Storybook args', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdcheckbox--default');

  const checkbox = page.getByRole('checkbox', { name: 'Diagnostics' });

  await expect(checkbox).toBeVisible();
  await expect(checkbox).not.toBeChecked();

  await clickCheckboxLabel(page, checkbox);
  await expect(checkbox).toBeChecked();

  await clickCheckboxLabel(page, checkbox);
  await expect(checkbox).not.toBeChecked();
});
