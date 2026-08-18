import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/storybook/storybook.testUtils';

test('MDButton default story renders an interactive, focusable button', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--default');

  const button = page.getByRole('button', { name: 'Save' });

  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();

  await button.focus();

  await expect(button).toBeFocused();
});

test('MDButton expanded target activates clicks outside the visible button box', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--expanded-target-hit-area');

  const surface = page.locator('#visual-md-button-target-hit');
  const button = surface.getByRole('button', { name: 'OK', exact: true });
  const count = page.locator('#visual-md-button-target-hit-count');
  const buttonBox = await button.boundingBox();

  expect(buttonBox).not.toBeNull();

  if (buttonBox == null) {
    throw new Error('Missing MDButton bounding box for expanded target hit test.');
  }

  const clickPoint = {
    x: buttonBox.x + buttonBox.width / 2,
    y: buttonBox.y - 2,
  };

  expect(clickPoint.y).toBeLessThan(buttonBox.y);

  await page.mouse.click(clickPoint.x, clickPoint.y);

  await expect(count).toHaveText('1');
});

test('MDButton small geometry preserves the selected 16dp horizontal padding (M3E-006)', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--small-geometry-contract');

  const button = page.locator('#small-geometry-button');
  const label = button.locator('.md-button__label-text');

  await expect(button).toBeVisible();
  await expect(label).toBeVisible();

  const buttonBox = await button.boundingBox();
  const labelBox = await label.boundingBox();
  if (!buttonBox || !labelBox) throw new Error('Missing MDButton geometry.');

  const horizontalPadding = buttonBox.width - labelBox.width;

  expect(horizontalPadding).toBe(32);
});

test('MDButton preserves form, loading accessibility, disabled, and public press contracts', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--behavior-contracts');

  const submit = page.getByRole('button', { name: 'Submit action', exact: true });
  const loading = page.getByRole('button', { name: 'Loading action', exact: true });
  const disabled = page.getByRole('button', { name: 'Disabled action', exact: true });
  const disabledLoading = page.getByRole('button', {
    name: 'Disabled loading action',
    exact: true,
  });

  await submit.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#md-button-submit-count')).toHaveText('1');

  await submit.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#md-button-submit-count')).toHaveText('2');

  await expect(loading).toHaveAttribute('aria-busy', 'true');
  await expect(loading).toBeEnabled();
  await expect(loading.getByRole('progressbar')).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await loading.click();
  await expect(page.locator('#md-button-loading-count')).toHaveText('1');

  await expect(disabled).toBeDisabled();
  const disabledBox = await disabled.boundingBox();
  if (!disabledBox) throw new Error('Missing disabled MDButton geometry.');
  await page.mouse.click(
    disabledBox.x + disabledBox.width / 2,
    disabledBox.y + disabledBox.height / 2,
  );
  await expect(page.locator('#md-button-disabled-count')).toHaveText('0');

  // Disabled plus loading keeps explicit activation blocking and decorative feedback together.
  await expect(disabledLoading).toBeDisabled();
  await expect(disabledLoading).toHaveAttribute('aria-busy', 'true');
  await expect(disabledLoading.getByRole('progressbar')).toHaveCount(0);
  const disabledLoadingBox = await disabledLoading.boundingBox();
  if (!disabledLoadingBox) throw new Error('Missing disabled+loading MDButton geometry.');
  await page.mouse.click(
    disabledLoadingBox.x + disabledLoadingBox.width / 2,
    disabledLoadingBox.y + disabledLoadingBox.height / 2,
  );
  await expect(page.locator('#md-button-disabled-count')).toHaveText('0');
});

test('MDButton composes its loading indicator with the ordinary contextual currentColor override, not a specificity-escalating rule', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--loading-indicator-presentation');

  const filledLoadingIndicator = page
    .getByTestId('visual-md-button-loading')
    .getByRole('button', { name: 'Saving', exact: true })
    .locator('.md-button__loading-indicator');

  const computedActiveIndicatorColor = await filledLoadingIndicator.evaluate((element) =>
    getComputedStyle(element).getPropertyValue(
      '--md-comp-loading-indicator-active-indicator-color',
    ),
  );

  expect(computedActiveIndicatorColor.trim().toLowerCase()).toBe('currentcolor');
});

test('MDButton drops undeclared dynamic attrs and never exposes their renderer state', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--host-attribute-boundary');

  const host = page.getByTestId('host-boundary-button');
  const toggle = page.getByTestId('host-boundary-toggle');

  const readRendererState = () =>
    host.evaluate<
      { selected: boolean; shape: string; toggle: boolean; variant: string },
      HTMLElement & { variant: string; shape: string; toggle: boolean; selected: boolean }
    >((button) => ({
      selected: button.selected,
      shape: button.shape,
      toggle: button.toggle,
      variant: button.variant,
    }));

  await expect(host).toBeVisible();
  expect(await readRendererState()).toEqual({
    selected: false,
    shape: 'rounded',
    toggle: false,
    variant: 'filled',
  });
  await expect(host).not.toHaveAttribute('bogus-consumer-flag');

  // The fixture flips the attempted override values on every click; the rendered custom-element
  // state must stay pinned to the adapter-owned defaults across every dynamic update, not just
  // on first render.
  await toggle.click();
  expect(await readRendererState()).toEqual({
    selected: false,
    shape: 'rounded',
    toggle: false,
    variant: 'filled',
  });
  await expect(host).not.toHaveAttribute('bogus-consumer-flag');

  await toggle.click();
  expect(await readRendererState()).toEqual({
    selected: false,
    shape: 'rounded',
    toggle: false,
    variant: 'filled',
  });
});

test('MDButton preserves normal native click bubbling to ancestor listeners', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--behavior-contracts');

  const button = page.getByRole('button', { name: 'Loading action', exact: true });
  const bubbledToDocument = page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        document.addEventListener(
          'click',
          () => {
            resolve(true);
          },
          { once: true },
        );
      }),
  );

  await button.click();

  expect(await bubbledToDocument).toBe(true);
});

test('MDButton variants and content keep component color inside a legacy Material surface', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--legacy-surface-color-ownership');

  await expect(page.getByTestId('legacy-surface-text')).toHaveCSS('color', 'rgb(179, 38, 30)');
  await expect(
    page.getByRole('button', { name: 'Surface filled' }).locator('.md-button__label-text'),
  ).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(
    page.getByRole('button', { name: 'Surface outlined' }).locator('.md-button__label-text'),
  ).toHaveCSS('color', 'rgb(73, 69, 79)');
  await expect(
    page.getByRole('button', { name: 'Surface text' }).locator('.md-button__label-text'),
  ).toHaveCSS('color', 'rgb(103, 80, 164)');

  const iconButton = page.getByRole('button', { name: 'Surface icon' });
  await expect(iconButton.locator('.md-button__label-text')).toHaveCSS('color', 'rgb(73, 69, 79)');
  await expect(page.getByTestId('legacy-surface-button-icon')).toHaveCSS(
    'color',
    'rgb(73, 69, 79)',
  );

  const loadingButton = page.getByRole('button', { name: 'Surface loading' });
  await expect(loadingButton.locator('.md-button__label-text')).toHaveCSS(
    'color',
    'rgb(103, 80, 164)',
  );
  await expect(loadingButton.locator('.md-loading-indicator')).toHaveCSS(
    'color',
    'rgb(103, 80, 164)',
  );

  // Component-token cascade proof (docs/component-tokens.md "Composition proof"): the
  // nested Loading indicator receives Button's contextual public-token override
  // (`.md-button__loading-indicator`) unresolved, since `currentColor` is a CSS-wide
  // keyword rather than a var() reference and is not substituted at custom-property
  // computed-value time. The standalone Loading indicator in the same legacy surface
  // carries no such override and resolves back to the family's own `:root` Material
  // default, proving the composition does not depend on specificity or source order.
  await expect(loadingButton.locator('.md-loading-indicator')).toHaveCSS(
    '--md-comp-loading-indicator-active-indicator-color',
    'currentColor',
  );
  await expect(page.getByRole('progressbar', { name: 'Surface standalone loading' })).toHaveCSS(
    '--md-comp-loading-indicator-active-indicator-color',
    '#6750a4',
  );
});

test('MDButton renders contextual text label colors in every selected state', async ({ page }) => {
  await openStory(page, 'material-3-components-buttons-mdbutton--contextual-text-tokens');

  const button = page.getByTestId('contextual-text-button');
  const label = button.locator('.md-button__label-text');
  const inversePrimary = 'rgb(208, 188, 255)';

  await expect(label).toHaveCSS('color', inversePrimary);

  await button.hover();
  await expect(label).toHaveCSS('color', inversePrimary);

  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await expect(label).toHaveCSS('color', inversePrimary);

  const box = await button.boundingBox();
  if (!box) throw new Error('Missing contextual MDButton geometry.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(label).toHaveCSS('color', inversePrimary);
  await page.mouse.up();
});
