import { expect, test } from '@playwright/test';
import { openStory } from '../storybook';

test('MDSwitch selected, disabled, and presentation states match the canonical baseline', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-switch-mdswitch--visual-states');
  const surface = page.getByTestId('visual-md-switch-states');

  await expect(surface).toHaveScreenshot('md-switch-states.png');
});
