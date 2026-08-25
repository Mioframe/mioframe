import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/storybook/storybook.testUtils';

test('MDFab resolves an accessible name from label and forwards pointer activation from its visible SVG icon', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-floating-action-button-mdfab--behavior-contracts');

  const fab = page.getByRole('button', { name: 'Compose a new message' });
  const clickCount = page.locator('#md-fab-click-count');
  const icon = page.getByTestId('behavior-fab-icon');

  await expect(fab).toBeVisible();
  await expect(fab).toBeEnabled();

  await icon.click();
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

test('MDFab renders the official medium FAB fixed geometry (80dp container, 28dp icon) at rest', async ({
  page,
}) => {
  // ARCHITECTURE.md "Implementation passes" #6a / "TEST IMPACT": DESIGN.md's Geometry and
  // layout table fixes the medium FAB's container at 80dp height/width and its icon at 28dp.
  // The single-host `m3e-fab` composition can affect this rendered geometry, so
  // `src/shared/ui/material/AGENTS.md`'s "Renderer boundary" section requires browser-level
  // numeric proof; the existing visual baseline (`MDFab.visual.spec.ts`) supplements but does
  // not substitute for it. The geometry story uses the same direct inline SVG composition as
  // every canonical FAB fixture, so the icon has its own independently measurable public
  // light-DOM box, distinct from the host container. The installed `@m3e/web@2.7.4` renderer's
  // shadow stylesheet sizes a slotted `<svg>` without a `slot` attribute to `width: 1em; height:
  // 1em`, inheriting the medium size's 28px icon font-size. This measures the actual rendered
  // public result, not a private shadow-DOM internal.
  //
  // This project's Playwright config pins `deviceScaleFactor: 1` with no browser zoom
  // (`playwright.storybook.config.ts`), so 1dp = 1 rendered CSS px here; the expected pixel
  // values below are DESIGN.md's dp values unconverted.
  await openStory(page, 'material-3-components-floating-action-button-mdfab--geometry-contract');

  const fab = page.getByTestId('geometry-fab');
  const icon = page.getByTestId('geometry-fab-icon');

  const fabBox = await fab.boundingBox();
  if (!fabBox) throw new Error('Missing MDFab geometry.');
  expect(fabBox.width).toBe(80);
  expect(fabBox.height).toBe(80);

  const iconBox = await icon.boundingBox();
  if (!iconBox) throw new Error('Missing MDFab icon geometry.');
  expect(iconBox.width).toBe(28);
  expect(iconBox.height).toBe(28);
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
