import { expect, test } from '@playwright/test';
import { openStory } from './storybook';

test('MDCard visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcard--visual-states');

  const surface = page.getByTestId('visual-md-card-states');

  await expect(surface).toHaveScreenshot('md-card-states.png');
});

test('MDCard interaction states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcard--visual-interaction-states');

  const surface = page.getByTestId('visual-md-card-interaction-states');

  await expect(surface).toHaveScreenshot('md-card-interaction-states.png');
});

test('MDCard static card has no role, tabindex, or actionable affordance', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcard--static-with-internal-actions');

  const card = page.locator('.md-card').first();

  await expect(card).not.toHaveAttribute('role');
  await expect(card).not.toHaveAttribute('tabindex');
  // Scoped to a direct child: the card's own conditional MDStateLayer renders
  // as a direct child of the root, while `.md-state-layer` descendant search
  // would also match the internal MDButtons' own state layers.
  await expect(card.locator('> .md-state-layer')).toHaveCount(0);

  await card.click({ position: { x: 4, y: 4 } });
  await expect(card.locator('> .md-ripple')).toHaveCount(0);

  await expect(page.getByRole('button', { name: 'Install' })).toBeVisible();
});

test('MDCard actionable button card emits action on click and keyboard activation', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdcard--action-behavior');

  const card = page.getByTestId('md-card-button-action');
  const count = page.getByTestId('md-card-button-action-count');

  await expect(card).toHaveCount(1);
  await expect(count).toHaveText('0');

  await card.click();
  await expect(count).toHaveText('1');

  await card.focus();
  await page.keyboard.press('Enter');
  await expect(count).toHaveText('2');

  await page.keyboard.press('Space');
  await expect(count).toHaveText('3');
});

test('MDCard actionable link card emits action and navigates on click and Enter', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdcard--action-behavior');

  const card = page.getByTestId('md-card-link-action');
  const count = page.getByTestId('md-card-link-action-count');

  await expect(card).toHaveAttribute('href', '#md-card-link-action-target');
  await expect(count).toHaveText('0');

  await card.click();
  await expect(count).toHaveText('1');
  await expect(page).toHaveURL(/#md-card-link-action-target$/);

  await page.evaluate(() => {
    window.location.hash = '';
  });
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(count).toHaveText('2');
  await expect(page).toHaveURL(/#md-card-link-action-target$/);
});

test('MDCard disabled link card blocks navigation, keeps aria-disabled semantics, and does not emit action', async ({
  page,
}) => {
  await openStory(page, 'shared-ui-mdcard--action-behavior');

  const linkCard = page.getByTestId('md-card-disabled-link-action');
  const count = page.getByTestId('md-card-disabled-link-action-count');
  const urlBeforeClick = page.url();

  await expect(linkCard).toHaveAttribute('aria-disabled', 'true');
  await expect(linkCard).toHaveAttribute('tabindex', '-1');
  await expect(linkCard).not.toHaveAttribute('href');

  // `aria-disabled="true"` makes Playwright's actionability check treat the
  // link as not enabled, so a plain click would hang waiting for it to
  // become enabled. Force the click to exercise MDCard's own script-level
  // click guard instead of Playwright's actionability check.
  await linkCard.click({ force: true });

  await expect(count).toHaveText('0');
  expect(page.url()).toBe(urlBeforeClick);
});

test('MDCard root establishes the Material surface context for descendants', async ({ page }) => {
  await openStory(page, 'shared-ui-mdcard--variants');

  const card = page.locator('.md-card').first();

  const surfaceContext = await card.evaluate((node) => {
    const style = getComputedStyle(node);

    return {
      containerColor: style.getPropertyValue('--md-container-color').trim(),
      contentColor: style.getPropertyValue('--md-content-color').trim(),
      currentContainerColor: style.getPropertyValue('--md-current-container-color').trim(),
      currentContentColor: style.getPropertyValue('--md-current-content-color').trim(),
    };
  });

  expect(surfaceContext.containerColor).not.toBe('');
  expect(surfaceContext.contentColor).not.toBe('');
  expect(surfaceContext.currentContainerColor).toBe(surfaceContext.containerColor);
  expect(surfaceContext.currentContentColor).toBe(surfaceContext.contentColor);
});

test('MDStateLayer visual states match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdstatelayer--visual-states');

  const surface = page.getByTestId('visual-md-state-layer');

  await expect(surface).toHaveScreenshot('md-state-layer-states.png');
});

test('MDStateLayer host integrations match baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-mdstatelayer--visual-host-integration');

  const surface = page.getByTestId('visual-md-state-layer-hosts');

  await expect(surface).toHaveScreenshot('md-state-layer-hosts.png');
});

test('MarkdownContent wide table matches baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-markdowncontent--wide-table');

  const surface = page.getByTestId('visual-markdown-content-wide-table');

  await expect(surface).toHaveScreenshot('markdown-content-wide-table.png');
});

test('MarkdownContent variants overview matches baseline', async ({ page }) => {
  await openStory(page, 'shared-ui-markdowncontent--variants-overview');

  const surface = page.getByTestId('visual-markdown-content-variants');

  await expect(surface).toHaveScreenshot('markdown-content-variants-overview.png');
});
