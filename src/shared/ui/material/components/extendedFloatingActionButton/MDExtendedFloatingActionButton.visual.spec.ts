import { expect, test } from '@playwright/test';
import { openStory } from '../../../../../../tests/e2e/visual/storybook';

test('MDExtendedFloatingActionButton size and icon compositions match the canonical baseline', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--visual-states',
  );
  const surface = page.getByTestId('visual-md-extended-fab-states');

  await expect(surface).toHaveScreenshot('md-extended-floating-action-button-states.png');
});

test('MDExtendedFloatingActionButton applies public color-mapping token overrides', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--token-override',
  );
  const surface = page.getByTestId('visual-md-extended-fab-token-override');

  await expect(surface).toHaveScreenshot('md-extended-floating-action-button-token-override.png');
});

// The following three tests prove the renderer-owned hover/focus/pressed container-elevation
// and state-layer tokens actually render a materially distinct result on real pointer/keyboard
// interaction, matching the MDCheckbox real-interaction-feedback pattern. Each drives a real
// interaction against the public MDExtendedFloatingActionButton host and captures the settled
// visible result with `animations: 'disabled'` (fast-forwards the renderer's private shadow-DOM
// CSS transitions to their end state deterministically, and also settles this family's own
// appear transition). None of these tests query, style, or otherwise inspect the private m3e
// shadow DOM directly; only the public host box is screenshotted.
test('MDExtendedFloatingActionButton renders visible renderer-owned hover feedback on real pointer hover', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--real-interaction-feedback',
  );
  const surface = page.getByTestId('visual-md-extended-fab-real-interaction');
  const fab = surface.getByRole('button', { name: 'Press me' });

  await fab.hover();

  await expect(surface).toHaveScreenshot('md-extended-floating-action-button-hover.png', {
    animations: 'disabled',
  });
});

test('MDExtendedFloatingActionButton renders visible renderer-owned focus feedback on real keyboard focus', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--real-interaction-feedback',
  );
  const surface = page.getByTestId('visual-md-extended-fab-real-interaction');

  // Deterministic focus setup only: focus success is proven by the Storybook behavior lane
  // (MDExtendedFloatingActionButton.behavior.spec.ts). This visual spec only establishes focus
  // state and captures the settled screenshot.
  await page.keyboard.press('Tab');

  await expect(surface).toHaveScreenshot('md-extended-floating-action-button-focus.png', {
    animations: 'disabled',
  });
});

// BEHAVIOR.md "States and state precedence": only the plain primary/secondary/tertiary color
// mappings define a focus indicator; the default primary-container path proven by the "focus"
// test above does not exercise `--m3e-focus-ring-*`. This test proves the plain-color bridge
// (`.md-extended-floating-action-button_color_primary` in MDExtendedFloatingActionButton.vue)
// actually renders a visible focus indicator on real keyboard focus.
test('MDExtendedFloatingActionButton renders a visible plain-color focus indicator on real keyboard focus', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--real-interaction-feedback-plain-color',
  );
  const surface = page.getByTestId('visual-md-extended-fab-plain-color-real-interaction');

  // Deterministic focus setup only: focus success is proven by the Storybook behavior lane
  // (MDExtendedFloatingActionButton.behavior.spec.ts). This visual spec only establishes focus
  // state and captures the settled screenshot.
  await page.keyboard.press('Tab');

  await expect(surface).toHaveScreenshot(
    'md-extended-floating-action-button-plain-color-focus.png',
    {
      animations: 'disabled',
    },
  );
});

test('MDExtendedFloatingActionButton renders a visible settled state layer on real pointer press', async ({
  page,
}) => {
  await openStory(
    page,
    'material-3-components-extended-floating-action-button-mdextendedfloatingactionbutton--real-interaction-feedback',
  );
  const surface = page.getByTestId('visual-md-extended-fab-real-interaction');
  const fab = surface.getByRole('button', { name: 'Press me' });
  const box = await fab.boundingBox();
  if (!box) {
    throw new Error(
      'Missing MDExtendedFloatingActionButton bounding box for real pointer pressed test.',
    );
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  await expect(surface).toHaveScreenshot('md-extended-floating-action-button-pressed.png', {
    animations: 'disabled',
  });

  await page.mouse.up();
});
