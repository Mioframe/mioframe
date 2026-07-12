import { devices, expect, test } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-ui-overlay--lifecycle-regression';

test.describe('menu lifecycle', () => {
  test('reopens a persistent menu after close without a stale interaction closing it, keeping nested teleported content inside', async ({
    page,
  }) => {
    await openStory(page, STORY_ID);

    const openButton = page.getByRole('button', { name: 'Open menu' });
    const menu = page.getByRole('group', { name: 'Lifecycle regression menu' });
    const selectAButton = page.getByRole('button', { name: 'Select A' });
    const openNestedButton = page.getByRole('button', { name: 'Open nested menu' });
    const nestedMenu = page.getByRole('group', { name: 'Nested lifecycle menu' });
    const pickNestedButton = page.getByRole('button', { name: 'Pick nested action' });

    // 1. open a menu
    await openButton.click();
    await expect(menu).toBeVisible();

    // 2. an internal interaction (opening the nested menu) does not close the overlay
    await openNestedButton.click();
    await expect(nestedMenu).toBeVisible();
    await expect(menu).toBeVisible();

    // 3/4. activating an item inside a registered child teleport does not close the parent
    await pickNestedButton.click();
    await expect(page.getByText('Nested pick activated 1 time(s)')).toBeVisible();
    await expect(menu).toBeVisible();
    await expect(
      page.getByText('Menu closed by outside interaction 0 time(s)', { exact: true }),
    ).toBeVisible();

    // 5. close it through the existing user action
    await selectAButton.click();
    await expect(menu).toHaveCount(0);
    await expect(page.getByText('Select A activated 1 time(s)')).toBeVisible();

    // 6. immediately reopen the same persistent menu instance
    await openButton.click();
    await expect(menu).toBeVisible();

    // 7/8. the reopened parent's nested menu starts closed and works again
    await openNestedButton.click();
    await expect(nestedMenu).toBeVisible();
    await pickNestedButton.click();
    await expect(page.getByText('Nested pick activated 2 time(s)')).toBeVisible();
    await expect(menu).toBeVisible();

    // 9. no event from the previous lifecycle closes the reopened menu, and the parent
    // item performs the intended action exactly once for this lifecycle
    await selectAButton.click();
    await expect(menu).toHaveCount(0);
    await expect(page.getByText('Select A activated 2 time(s)')).toBeVisible();
    await expect(
      page.getByText('Menu closed by outside interaction 0 time(s)', { exact: true }),
    ).toBeVisible();
  });

  test('an outside click closes the menu once and still performs the outside control own action', async ({
    page,
  }) => {
    await openStory(page, STORY_ID);

    const openButton = page.getByRole('button', { name: 'Open menu' });
    const menu = page.getByRole('group', { name: 'Lifecycle regression menu' });
    const outsideButton = page.getByRole('button', { name: 'Menu outside action' });

    await openButton.click();
    await expect(menu).toBeVisible();

    await outsideButton.click();
    await expect(menu).toHaveCount(0);
    await expect(page.getByText('Menu outside action activated 1 time(s)')).toBeVisible();
    await expect(
      page.getByText('Menu closed by outside interaction 1 time(s)', { exact: true }),
    ).toBeVisible();
  });

  test('wheel outside interactions close the menu once per open lifecycle while the listener is live', async ({
    page,
  }) => {
    await openStory(page, STORY_ID);

    const openButton = page.getByRole('button', { name: 'Open menu' });
    const menu = page.getByRole('group', { name: 'Lifecycle regression menu' });
    const outsideButton = page.getByRole('button', { name: 'Menu outside action' });

    // 1/2/3. open the menu, send one outside wheel interaction against the live listener
    await openButton.click();
    await expect(menu).toBeVisible();

    await outsideButton.hover();
    await page.mouse.wheel(0, 100);
    await expect(menu).toHaveCount(0);
    await expect(
      page.getByText('Menu closed by outside interaction 1 time(s)', { exact: true }),
    ).toBeVisible();

    // 4/5. a wheel event after closure does not add another emit
    await page.mouse.wheel(0, 100);
    await expect(
      page.getByText('Menu closed by outside interaction 1 time(s)', { exact: true }),
    ).toBeVisible();

    // 6/7/8. reopening and sending a new outside wheel advances the counter exactly once
    await openButton.click();
    await expect(menu).toBeVisible();

    await outsideButton.hover();
    await page.mouse.wheel(0, 100);
    await expect(menu).toHaveCount(0);
    await expect(
      page.getByText('Menu closed by outside interaction 2 time(s)', { exact: true }),
    ).toBeVisible();
  });

  test.describe('touch', () => {
    // Spread `defaultBrowserType` from the device preset is forbidden inside a
    // describe-level `test.use()` (it forces a new worker); pass only the
    // context options needed for real touch emulation instead.
    test.use({
      viewport: devices['Pixel 5'].viewport,
      userAgent: devices['Pixel 5'].userAgent,
      deviceScaleFactor: devices['Pixel 5'].deviceScaleFactor,
      isMobile: devices['Pixel 5'].isMobile,
      hasTouch: devices['Pixel 5'].hasTouch,
    });

    test('a touch tap outside closes the menu once without a duplicate close from the synthesized compatibility click', async ({
      page,
    }) => {
      await openStory(page, STORY_ID);

      const openButton = page.getByRole('button', { name: 'Open menu' });
      const menu = page.getByRole('group', { name: 'Lifecycle regression menu' });
      const outsideButton = page.getByRole('button', { name: 'Menu outside action' });

      await openButton.tap();
      await expect(menu).toBeVisible();

      await outsideButton.tap();
      await expect(menu).toHaveCount(0);
      await expect(page.getByText('Menu outside action activated 1 time(s)')).toBeVisible();
      await expect(
        page.getByText('Menu closed by outside interaction 1 time(s)', { exact: true }),
      ).toBeVisible();
    });
  });
});

test.describe('overlay tooltip lifecycle', () => {
  test('an outside click closes the overlay tooltip once, performs the outside control own action, and the tooltip reopens unaffected', async ({
    page,
  }) => {
    await openStory(page, STORY_ID);

    const openButton = page.getByRole('button', { name: 'Open overlay tooltip' });
    const outsideButton = page.getByRole('button', { name: 'Overlay tooltip outside action' });
    const tooltipAction = page.getByRole('button', { name: 'Overlay tooltip action' });

    await openButton.click();
    await expect(tooltipAction).toBeVisible();

    await outsideButton.click();
    await expect(tooltipAction).toHaveCount(0);
    await expect(
      page.getByText('Overlay tooltip closed by outside interaction 1 time(s)', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Overlay tooltip outside action activated 1 time(s)'),
    ).toBeVisible();

    await openButton.click();
    await expect(tooltipAction).toBeVisible();
    await expect(
      page.getByText('Overlay tooltip closed by outside interaction 1 time(s)', { exact: true }),
    ).toBeVisible();
  });
});

test.describe('rich tooltip lifecycle', () => {
  test('an outside click closes the rich tooltip once, performs the outside control own action, and it reopens through its target click', async ({
    page,
  }) => {
    await openStory(page, STORY_ID);

    const openButton = page.getByRole('button', { name: 'Open rich tooltip' });
    const outsideButton = page.getByRole('button', { name: 'Rich tooltip outside action' });
    const tooltipAction = page.getByRole('button', { name: 'Rich tooltip action' });

    await openButton.click();
    await expect(tooltipAction).toBeVisible();

    await outsideButton.click();
    await expect(tooltipAction).toHaveCount(0);
    await expect(
      page.getByText('Rich tooltip closed by outside interaction 1 time(s)', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Rich tooltip outside action activated 1 time(s)')).toBeVisible();

    await openButton.click();
    await expect(tooltipAction).toBeVisible();

    await tooltipAction.click();
    await expect(page.getByText('Rich tooltip action activated 1 time(s)')).toBeVisible();
  });
});
