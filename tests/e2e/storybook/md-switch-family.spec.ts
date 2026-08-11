import { expect, test } from '@playwright/test';
import { openStory } from './storybook.testUtils';

test('MDSwitch click, Space, and Enter toggle the standalone default and report the resulting value', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--behavior-contracts');

  // `exact: true` avoids any case-insensitive substring collision with the story's separate
  // "Standalone labelled switch".
  const labelled = page.getByRole('switch', { name: 'Labelledby switch', exact: true });
  const changeCount = page.locator('#md-switch-change-count');

  await expect(labelled).toHaveAttribute('aria-checked', 'false');

  await labelled.click();
  await expect(labelled).toHaveAttribute('aria-checked', 'true');
  await expect(changeCount).toHaveText('1');

  await labelled.focus();
  await page.keyboard.press('Space');
  await expect(labelled).toHaveAttribute('aria-checked', 'false');
  await expect(changeCount).toHaveText('2');

  // Official Accessibility guidance documents both Space and Enter toggling the switch
  // (DESIGN.md "Accessibility"); ARCHITECTURE.md flagged Enter-key activation as only
  // partially confirmed from static compiled-source inspection. This proves it toggles in a
  // real browser, resolving that gap to `direct` with no wrapper keydown handler needed.
  await page.keyboard.press('Enter');
  await expect(labelled).toHaveAttribute('aria-checked', 'true');
  await expect(changeCount).toHaveText('3');
});

test('MDSwitch resolves an accessible name from aria-labelledby and aria-label, and blocks disabled activation', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--behavior-contracts');

  await expect(page.getByRole('switch', { name: 'Labelledby switch', exact: true })).toBeVisible();

  const standalone = page.getByRole('switch', { name: 'Standalone labelled switch' });
  await expect(standalone).toHaveAttribute('aria-checked', 'false');
  await standalone.click();
  await expect(standalone).toHaveAttribute('aria-checked', 'true');

  const disabled = page.getByRole('switch', { name: 'Disabled switch' });
  await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveAttribute('aria-checked', 'false');
  await disabled.click({ force: true });
  await expect(disabled).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Tab');
  await expect(disabled).not.toBeFocused();
});

test('MDSwitch disabled and presentation are both unreachable by Tab, resolving the renderer disabled-focus-order gap', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--tab-order-fixture');

  const before = page.locator('#tab-order-before');
  const after = page.locator('#tab-order-after');

  await before.focus();
  await expect(before).toBeFocused();

  // Only one Tab press from `before` reaches `after`: both the disabled switch and the
  // presentation switch sitting between them in the DOM are skipped. This confirms the
  // ARCHITECTURE.md "disabled tab-reachability" gap resolves to `direct` (the renderer's own
  // Focusable/Disabled mixins already remove it from the tab order; no wrapper tabindex="-1"
  // correction is required) and that `presentation` stays fully out of the tab order too.
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
});

test('MDSwitch presentation is unreachable by real pointer input and stays hidden from the accessibility tree', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--presentation');

  // The decorative composition scenario: the wrapping element owns the accessible switch role;
  // MDSwitch itself must not add a second accessible switch node.
  await expect(page.getByRole('switch', { name: 'Automatic updates' })).toHaveCount(1);

  const decorative = page.locator('[data-testid="md-switch-presentation"] m3e-switch');
  await expect(decorative).toBeVisible();
  await expect(decorative).toHaveAttribute('aria-hidden', 'true');
  await expect(decorative).toHaveAttribute('tabindex', '-1');

  const readChecked = () =>
    decorative.evaluate<boolean, HTMLElement & { checked: boolean }>((el) => el.checked);

  expect(await readChecked()).toBe(true);

  const box = await decorative.boundingBox();
  if (box == null) {
    throw new Error('Missing MDSwitch presentation bounding box.');
  }

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // A real pointer click at the decorative switch's own rendered location must not reach the
  // renderer's internal click-toggle handler: `pointer-events: none` blocks it, so the
  // renderer's own `checked` value stays exactly as authored.
  expect(await readChecked()).toBe(true);
});

test('MDSwitch expanded 48dp target activates a toggle outside the visible 32dp track', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--target-hit-area');

  const surface = page.locator('[data-testid="visual-md-switch-target-hit"]');
  const toggle = surface.getByRole('switch', { name: 'Target hit' });
  const count = page.locator('#visual-md-switch-target-hit-count');
  const box = await toggle.boundingBox();

  if (box == null) {
    throw new Error('Missing MDSwitch bounding box for target hit test.');
  }

  // The visible track is 32 CSS pixels tall; the renderer's internal 48dp touch target is
  // vertically centered over it, so a point a few pixels above the host's own bounding box
  // still lands inside the larger interactive target (DESIGN.md "Geometry and layout": Track
  // height 32dp, Target size 48dp).
  const clickPoint = { x: box.x + box.width / 2, y: box.y - 4 };

  expect(clickPoint.y).toBeLessThan(box.y);

  await page.mouse.click(clickPoint.x, clickPoint.y);

  await expect(count).toHaveText('1');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
});

test('MDSwitch drops undeclared dynamic renderer inputs and never exposes their state or an undeclared click listener', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--host-attribute-boundary');

  const host = page.getByTestId('host-boundary-switch');
  const toggle = page.getByTestId('host-boundary-toggle');
  const clickCount = page.getByTestId('host-boundary-click-count');

  const readRendererState = () =>
    host.evaluate<
      { checked: boolean; icons: string; name: string; value: string },
      HTMLElement & { checked: boolean; icons: string; name: string; value: string }
    >((el) => ({ checked: el.checked, icons: el.icons, name: el.name, value: el.value }));

  await expect(host).toBeVisible();
  expect(await readRendererState()).toEqual({
    checked: false,
    icons: 'none',
    name: '',
    value: 'on',
  });

  await toggle.click();
  expect(await readRendererState()).toEqual({
    checked: false,
    icons: 'none',
    name: '',
    value: 'on',
  });

  // The story's own `@click` handler is not part of MDSwitch's public API; a real click on the
  // rendered host must never invoke it.
  const box = await host.boundingBox();
  if (box == null) {
    throw new Error('Missing MDSwitch bounding box for host-attribute boundary test.');
  }
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(clickCount).toHaveText('0');
});
