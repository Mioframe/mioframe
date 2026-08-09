import { expect, test } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-ui-dialog-dialogform--zero-tabbable-actions';

// Proves DialogForm.vue's real fallback-focus fix: the form's tabindex="-1"
// plus useFocusTrap's fallbackFocus keeps the real focus-trap library usable
// even when every action control is disabled. This cannot be faithfully
// proven with a mocked useFocusTrap (see DialogForm.test.ts, which owns the
// deterministic Vue wiring contract instead).
test.describe('DialogForm fallback focus with zero tabbable action controls', () => {
  test('the real focus trap activates and keeps focus on the form fallback target, and Tab cannot escape the dialog', async ({
    page,
  }) => {
    await openStory(page, STORY_ID);

    const dialog = page.getByRole('dialog', { name: 'Confirm' });
    await expect(dialog).toBeVisible();

    const form = dialog.locator('form');
    await expect(form).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(form).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(form).toBeFocused();
  });
});
