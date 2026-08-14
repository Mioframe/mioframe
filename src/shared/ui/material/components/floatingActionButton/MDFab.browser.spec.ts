import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/storybook/storybook.testUtils';

test('MDFab resolves an accessible name from label and responds to native click', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-floating-action-button-mdfab--behavior-contracts');

  const fab = page.getByRole('button', { name: 'Compose a new message' });
  const clickCount = page.locator('#md-fab-click-count');

  await expect(fab).toBeVisible();
  await expect(fab).toBeEnabled();

  await fab.click();
  await expect(clickCount).toHaveText('1');
});

test('MDFab Space and Enter keyboard activation each produce exactly one click', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-floating-action-button-mdfab--behavior-contracts');

  const fab = page.getByRole('button', { name: 'Compose a new message' });
  const clickCount = page.locator('#md-fab-click-count');

  await fab.focus();
  await expect(fab).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(clickCount).toHaveText('1');

  await page.keyboard.press('Space');
  await expect(clickCount).toHaveText('2');
});

test('MDFab drops undeclared dynamic attrs and never exposes their renderer state', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-floating-action-button-mdfab--host-attribute-boundary',
  );

  const host = page.getByTestId('host-boundary-fab');
  const toggle = page.getByTestId('host-boundary-toggle');

  const readRendererState = () =>
    host.evaluate<
      { disabled: boolean; extended: boolean; lowered: boolean; size: string; variant: string },
      HTMLElement & {
        disabled: boolean;
        extended: boolean;
        lowered: boolean;
        size: string;
        variant: string;
      }
    >((fab) => ({
      disabled: fab.disabled,
      extended: fab.extended,
      lowered: fab.lowered,
      size: fab.size,
      variant: fab.variant,
    }));

  await expect(host).toBeVisible();
  expect(await readRendererState()).toEqual({
    disabled: false,
    extended: false,
    lowered: false,
    size: 'medium',
    variant: 'primary-container',
  });
  await expect(host).not.toHaveAttribute('bogus-consumer-flag');

  // The fixture flips the attempted override values on every click; the rendered custom-element
  // state must stay pinned to the adapter-owned defaults across every dynamic update, not just
  // on first render.
  await toggle.click();
  expect(await readRendererState()).toEqual({
    disabled: false,
    extended: false,
    lowered: false,
    size: 'medium',
    variant: 'primary-container',
  });
  await expect(host).not.toHaveAttribute('bogus-consumer-flag');

  await toggle.click();
  expect(await readRendererState()).toEqual({
    disabled: false,
    extended: false,
    lowered: false,
    size: 'medium',
    variant: 'primary-container',
  });
});
