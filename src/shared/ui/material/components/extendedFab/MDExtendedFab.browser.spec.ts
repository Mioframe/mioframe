import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/storybook/storybook.testUtils';

test('MDExtendedFab resolves an accessible name from label and forwards pointer activation from its visible SVG icon', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-extended-fab-mdextendedfab--behavior-contracts');

  const fab = page.getByRole('button', { name: 'Add' });
  const clickCount = page.locator('#md-extended-fab-click-count');
  const icon = page.getByTestId('behavior-extended-fab-icon');

  await expect(fab).toBeVisible();
  await expect(fab).toBeEnabled();

  await icon.click();
  await expect(clickCount).toHaveText('1');
});

test('MDExtendedFab Space and Enter keyboard activation each produce exactly one click', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-extended-fab-mdextendedfab--behavior-contracts');

  const fab = page.getByRole('button', { name: 'Add' });
  const clickCount = page.locator('#md-extended-fab-click-count');

  await fab.focus();
  await expect(fab).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(clickCount).toHaveText('1');

  await page.keyboard.press('Space');
  await expect(clickCount).toHaveText('2');
});

test('MDExtendedFab renders the official small Extended FAB fixed geometry (56dp container height, 24dp icon, 16dp leading/trailing padding, 8dp icon-label gap) at rest', async ({
  page,
}) => {
  // ARCHITECTURE.md "Implementation passes" #6 / "TEST IMPACT": DESIGN.md's Geometry and layout
  // table fixes the small Extended FAB's container height at 56dp, icon at 24dp, leading/trailing
  // space at 16dp each, and icon-label space at 8dp. Container width is not asserted: DESIGN.md
  // documents the container as dynamic-width ("hugs its content") for the small/medium/large
  // variants, with no minimum-width value (src/shared/ui/material/AGENTS.md "Renderer boundary"
  // requires browser-level numeric geometry proof for renderer-composition-affected parts; the
  // existing visual baseline (MDExtendedFab.visual.spec.ts) supplements but does not substitute
  // for it). The geometry story uses the same direct inline SVG icon and light-DOM label text
  // composition as every canonical fixture, so the icon and label each have their own
  // independently measurable public light-DOM box, distinct from the host container and from each
  // other. The installed `@m3e/web@2.7.4` renderer's shadow stylesheet sizes a slotted `<svg>`
  // without a `slot` attribute to `width: 1em; height: 1em`, inheriting the small size's 24px icon
  // font-size. This measures the actual rendered public result, not a private shadow-DOM internal.
  //
  // This project's Playwright config pins `deviceScaleFactor: 1` with no browser zoom
  // (`playwright.storybook.config.ts`), so 1dp = 1 rendered CSS px here; the expected pixel values
  // below are DESIGN.md's dp values unconverted.
  await openStory(page, 'material-3-components-extended-fab-mdextendedfab--geometry-contract');

  const fab = page.getByTestId('geometry-extended-fab');
  const icon = page.getByTestId('geometry-extended-fab-icon');
  const label = fab.locator('[slot="label"]');

  const fabBox = await fab.boundingBox();
  if (!fabBox) throw new Error('Missing MDExtendedFab geometry.');
  expect(fabBox.height).toBe(56);

  const iconBox = await icon.boundingBox();
  if (!iconBox) throw new Error('Missing MDExtendedFab icon geometry.');
  expect(iconBox.width).toBe(24);
  expect(iconBox.height).toBe(24);

  const labelBox = await label.boundingBox();
  if (!labelBox) throw new Error('Missing MDExtendedFab label geometry.');

  expect(Math.round(iconBox.x - fabBox.x)).toBe(16);
  expect(Math.round(labelBox.x - (iconBox.x + iconBox.width))).toBe(8);
  expect(Math.round(fabBox.x + fabBox.width - (labelBox.x + labelBox.width))).toBe(16);
});

test('MDExtendedFab drops undeclared dynamic attrs and never exposes their renderer state', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-fab-mdextendedfab--host-attribute-boundary',
  );

  const host = page.getByTestId('host-boundary-extended-fab');
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
    extended: true,
    lowered: false,
    size: 'small',
    variant: 'primary-container',
  });
  await expect(host).not.toHaveAttribute('bogus-consumer-flag');

  // The fixture flips the attempted override values on every click; the rendered custom-element
  // state must stay pinned to the adapter-owned defaults across every dynamic update, not just
  // on first render.
  await toggle.click();
  expect(await readRendererState()).toEqual({
    disabled: false,
    extended: true,
    lowered: false,
    size: 'small',
    variant: 'primary-container',
  });
  await expect(host).not.toHaveAttribute('bogus-consumer-flag');

  await toggle.click();
  expect(await readRendererState()).toEqual({
    disabled: false,
    extended: true,
    lowered: false,
    size: 'small',
    variant: 'primary-container',
  });
});
