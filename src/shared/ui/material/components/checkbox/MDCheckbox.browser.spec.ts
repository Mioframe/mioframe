import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/storybook/storybook.testUtils';

test('MDCheckbox click and Space activation each produce exactly one public intent through the real renderer beforeinput/preventDefault lifecycle', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--behavior-contracts');

  // `exact: true` avoids any case-insensitive substring collision with the story's separate
  // "Standalone labelled checkbox".
  const labelled = page.getByRole('checkbox', { name: 'Labelledby checkbox', exact: true });
  const changeCount = page.locator('#md-checkbox-change-count');

  await expect(labelled).toHaveAttribute('aria-checked', 'false');

  await labelled.click();
  await expect(labelled).toHaveAttribute('aria-checked', 'true');
  await expect(changeCount).toHaveText('1');

  await labelled.focus();
  await page.keyboard.press('Space');
  await expect(labelled).toHaveAttribute('aria-checked', 'false');
  await expect(changeCount).toHaveText('2');
});

test('MDCheckbox Enter produces no effect, unlike Switch', async ({ page }) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--behavior-contracts');

  const labelled = page.getByRole('checkbox', { name: 'Labelledby checkbox', exact: true });
  const changeCount = page.locator('#md-checkbox-change-count');

  await labelled.focus();
  await expect(labelled).toHaveAttribute('aria-checked', 'false');

  // The installed renderer's `KeyboardClick(Focusable(...), false)` mixin composition
  // (ARCHITECTURE.md "Renderer mapping and gaps") synthesizes a click for Space only; Enter must
  // not toggle the checkbox or fire any public intent.
  await page.keyboard.press('Enter');
  await expect(labelled).toHaveAttribute('aria-checked', 'false');
  await expect(changeCount).toHaveText('0');
});

test('MDCheckbox resolves an accessible name from aria-labelledby and aria-label, and blocks disabled activation', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--behavior-contracts');

  await expect(
    page.getByRole('checkbox', { name: 'Labelledby checkbox', exact: true }),
  ).toBeVisible();

  const standalone = page.getByRole('checkbox', { name: 'Standalone labelled checkbox' });
  await expect(standalone).toHaveAttribute('aria-checked', 'false');
  await standalone.click();
  await expect(standalone).toHaveAttribute('aria-checked', 'true');

  const disabled = page.getByRole('checkbox', { name: 'Disabled checkbox' });
  await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveAttribute('aria-checked', 'false');

  // `disabled` is not Playwright-actionable (its own guard blocks `beforeinput` dispatch before
  // any mutation, per ARCHITECTURE.md's "Renderer mapping and gaps"), so locator `.click()` would
  // require the forbidden `force` option. Prove the same pointer-activation-is-blocked contract
  // with ordinary real pointer input at the rendered element's own coordinates instead.
  const disabledBox = await disabled.boundingBox();
  if (disabledBox == null) {
    throw new Error('Missing MDCheckbox disabled bounding box.');
  }
  await page.mouse.click(
    disabledBox.x + disabledBox.width / 2,
    disabledBox.y + disabledBox.height / 2,
  );
  await expect(disabled).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Tab');
  await expect(disabled).not.toBeFocused();
});

test('MDCheckbox native <label for> association does not produce an accessible name (M3E-005, matching Switch M3E-004)', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--adjacent-label');

  // Informational per ARCHITECTURE.md "Renderer mapping and gaps": not relied upon as the
  // accessible-name mechanism (`aria-label`/`aria-labelledby` is selected and confirmed above).
  // Confirmed by this real-browser accessibility-tree check: the identical `Labelled` mixin
  // exhibits the same `M3E-004`-class gap already confirmed on `m3e-switch` in this installed
  // `2.6.3` version — the checkbox reports no accessible name from `for`/`id` association alone,
  // even though the same association does synthesize a `click` (see the adjacent-label
  // click-to-toggle test above). Recorded as `M3E-005` in `docs/m3e-defects.md`.
  await expect(page.locator('#adjacent-label-checkbox')).toHaveAccessibleName('');
});

test('MDCheckbox adjacent-label click-to-toggle activation works for an external <label for>', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--adjacent-label');

  const checkbox = page.locator('#adjacent-label-checkbox');
  const label = page.locator('label[for="adjacent-label-checkbox"]');

  await expect(checkbox).toHaveAttribute('aria-checked', 'false');

  await label.click();

  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
});

test('MDCheckbox rejected intent leaves the rendered checked/indeterminate unchanged when the owning consumer does not write the emitted values back', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--rejected-intent');

  const toggle = page.getByRole('checkbox', { name: 'Rejected intent' });
  const count = page.locator('#md-checkbox-rejected-intent-count');
  const value = page.locator('#md-checkbox-rejected-intent-value');

  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await toggle.click();

  // Exactly one intent was reported with the intended next value...
  await expect(count).toHaveText('1');
  await expect(value).toHaveText('true');
  // ...but since the fixture never writes it back to `checked`, the rendered checkbox stays at
  // its prior value: `checked`/`indeterminate` remain the sole, one-directional sources of
  // truth, with no window in which the renderer's own state could have diverged.
  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await toggle.click();
  await expect(count).toHaveText('2');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
});

test('MDCheckbox disabled and presentation are both unreachable by Tab, resolving the renderer disabled-focus-order gap', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--tab-order-fixture');

  const before = page.locator('#tab-order-before');
  const after = page.locator('#tab-order-after');

  await before.focus();
  await expect(before).toBeFocused();

  // Only one Tab press from `before` reaches `after`: both the disabled checkbox and the
  // presentation checkbox sitting between them in the DOM are skipped. This confirms the
  // renderer's own Focusable/Disabled mixins already remove it from the tab order (no wrapper
  // tabindex="-1" correction is needed for `disabled`) and that `presentation` stays fully out
  // of the tab order.
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();
});

test('MDCheckbox presentation is unreachable by real pointer input and stays hidden from the accessibility tree', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--presentation');

  // The decorative composition scenario: the wrapping element owns the accessible checkbox role;
  // MDCheckbox itself must not add a second accessible checkbox node.
  await expect(page.getByRole('checkbox', { name: 'Select item' })).toHaveCount(1);

  const decorative = page.locator('[data-testid="md-checkbox-presentation"] m3e-checkbox');
  await expect(decorative).toBeVisible();
  await expect(decorative).toHaveAttribute('aria-hidden', 'true');
  await expect(decorative).toHaveAttribute('tabindex', '-1');

  const readChecked = () =>
    decorative.evaluate<boolean, HTMLElement & { checked: boolean }>((el) => el.checked);

  expect(await readChecked()).toBe(true);

  const box = await decorative.boundingBox();
  if (box == null) {
    throw new Error('Missing MDCheckbox presentation bounding box.');
  }

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // A real pointer click at the decorative checkbox's own rendered location must not reach the
  // renderer's internal click-toggle handler: `pointer-events: none` blocks it, so the
  // renderer's own `checked` value stays exactly as authored.
  expect(await readChecked()).toBe(true);
});

test('MDCheckbox presentation composition: pointer input on the decorative region reaches the owning fixture action, and its state flows back into the rendered checked', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--presentation-composition');

  const owner = page.getByTestId('md-checkbox-presentation-composition');
  const decorative = owner.locator('m3e-checkbox');
  const count = page.locator('#md-checkbox-presentation-composition-count');

  const readChecked = () =>
    decorative.evaluate<boolean, HTMLElement & { checked: boolean }>((el) => el.checked);

  await expect(owner).toHaveAttribute('aria-checked', 'false');
  expect(await readChecked()).toBe(false);

  const box = await decorative.boundingBox();
  if (box == null) {
    throw new Error('Missing MDCheckbox presentation-composition bounding box.');
  }

  // A real pointer click at the decorative checkbox's own visible location:
  // `pointer-events: none` makes the renderer itself unreachable, so the click must land on the
  // owning fixture element instead, which owns the accessible role and the actual toggle action.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  await expect(count).toHaveText('1');
  await expect(owner).toHaveAttribute('aria-checked', 'true');
  // The owner's state update flows back into `checked`, the only thing that ever writes the
  // renderer's `checked`; the decorative renderer never independently toggled itself.
  expect(await readChecked()).toBe(true);
});

test('MDCheckbox expanded 48dp target activates a toggle outside the visible 18dp container', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--target-hit-area');

  const surface = page.locator('[data-testid="visual-md-checkbox-target-hit"]');
  const toggle = surface.getByRole('checkbox', { name: 'Target hit' });
  const count = page.locator('#visual-md-checkbox-target-hit-count');
  const box = await toggle.boundingBox();

  if (box == null) {
    throw new Error('Missing MDCheckbox bounding box for target hit test.');
  }

  // The visible container is 18 CSS pixels square; the renderer's internal 48dp touch target is
  // centered over it, so a point a few pixels outside the host's own bounding box still lands
  // inside the larger interactive target (DESIGN.md "Geometry and layout": Container 18dp,
  // Target size 48dp).
  const clickPoint = { x: box.x + box.width / 2, y: box.y - 4 };

  expect(clickPoint.y).toBeLessThan(box.y);

  await page.mouse.click(clickPoint.x, clickPoint.y);

  await expect(count).toHaveText('1');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
});

test('MDCheckbox drops undeclared dynamic renderer inputs and never exposes their state or an undeclared click listener', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-checkbox-mdcheckbox--host-attribute-boundary');

  const host = page.getByTestId('host-boundary-checkbox');
  const toggle = page.getByTestId('host-boundary-toggle');
  const clickCount = page.getByTestId('host-boundary-click-count');

  const readRendererState = () =>
    host.evaluate<
      { checked: boolean; name: string; required: boolean; value: string },
      HTMLElement & { checked: boolean; name: string; required: boolean; value: string }
    >((el) => ({ checked: el.checked, name: el.name, required: el.required, value: el.value }));

  await expect(host).toBeVisible();
  expect(await readRendererState()).toEqual({
    checked: false,
    name: '',
    required: false,
    value: 'on',
  });

  await toggle.click();
  expect(await readRendererState()).toEqual({
    checked: false,
    name: '',
    required: false,
    value: 'on',
  });

  // The story's own `@click` handler is not part of MDCheckbox's public API; a real click on the
  // rendered host must never invoke it.
  const box = await host.boundingBox();
  if (box == null) {
    throw new Error('Missing MDCheckbox bounding box for host-attribute boundary test.');
  }
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(clickCount).toHaveText('0');
});
