import { expect, test } from '@playwright/test';
import { launchApp } from './helpers';

const openHelpIndex = async (page: Parameters<typeof launchApp>[0]) => {
  await launchApp(page);
  await page.getByRole('button', { name: /^settings$/i }).click();
  await page
    .getByRole('button', { name: /data storage, backup, restore, and troubleshooting guides/i })
    .click();
  await expect(page.locator('.md-app-bar__headline', { hasText: /^help$/i })).toBeVisible();
};

const openArticle = async (page: Parameters<typeof launchApp>[0], title: RegExp) => {
  await page.getByRole('button', { name: title }).click();
  await expect(page.locator('.help-article-pane')).toBeVisible();
};

test('internal link without an anchor opens the target article scrolled to the top', async ({
  page,
}) => {
  await openHelpIndex(page);
  await openArticle(page, /^data storage$/i);

  // Baseline: the resting scroll position of a freshly opened article, before any link
  // click scrolls the container. The pane-local app bar lives in `.md-pane__top-bar`,
  // outside `.md-pane__content`, so it never affects the scroll baseline.
  // `MDPane` owns the actual scroll container (`paneContainer`, target of `scrollTo`),
  // which is distinct from `.help-article-body`, the link/content lookup scope.
  const paneContentEl = page.locator('.help-article-pane .md-pane__content');
  const topRestingScrollTop = await paneContentEl.evaluate((el) => el.scrollTop);

  const articleBody = page.locator('.help-article-pane .help-article-body');
  await articleBody.getByRole('link', { name: /^backup and restore$/i }).click();

  await expect(
    page.locator('.help-article-pane .md-app-bar__headline', { hasText: /^backup and restore$/i }),
  ).toBeVisible();

  // The click scrolled the source link into view before activating it; the navigated-to
  // article resets scroll asynchronously (post-flush watcher), so poll instead of reading
  // scrollTop once right after the click.
  await expect.poll(() => paneContentEl.evaluate((el) => el.scrollTop)).toBe(topRestingScrollTop);
});

test('internal link with an anchor scrolls the target heading into view', async ({ page }) => {
  await openHelpIndex(page);
  await openArticle(page, /^data storage$/i);

  const articleBody = page.locator('.help-article-pane .help-article-body');
  await articleBody.getByRole('link', { name: /^backup expectations$/i }).click();

  const heading = page.getByRole('heading', { name: /^backup expectations$/i, level: 2 });
  await expect(heading).toBeInViewport();
});

test('the pane-local app bar stays fixed while the article body scrolls', async ({ page }) => {
  await openHelpIndex(page);
  await openArticle(page, /^data storage$/i);

  const topBar = page.locator('.help-article-pane .md-pane__top-bar');
  const paneContentEl = page.locator('.help-article-pane .md-pane__content');

  const topBarBoxBefore = await topBar.boundingBox();
  expect(topBarBoxBefore).not.toBeNull();

  await paneContentEl.evaluate((el) => {
    el.scrollTo({ top: el.scrollHeight });
  });
  await expect.poll(() => paneContentEl.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);

  const topBarBoxAfter = await topBar.boundingBox();
  expect(topBarBoxAfter).not.toBeNull();
  // Tolerate subpixel/browser rounding rather than asserting exact pixel equality.
  expect(Math.abs((topBarBoxAfter?.y ?? 0) - (topBarBoxBefore?.y ?? 0))).toBeLessThanOrEqual(1);
});

test('external links are not hijacked by in-app help navigation', async ({ page }) => {
  await openHelpIndex(page);
  await openArticle(page, /^troubleshooting data problems$/i);

  const articleBody = page.locator('.help-article-pane .help-article-body');
  const externalLink = articleBody.getByRole('link', { name: /^github discussions$/i });

  await expect(externalLink).toHaveAttribute('href', /^https:\/\/github\.com\//);
  await expect(externalLink).toHaveAttribute('target', '_blank');
  await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');

  // Native middle-click avoids actually navigating away from the test page while still
  // exercising the same click path `onContentClick` handles; in-app routing must not
  // intercept it, so the help pane stays on the same article.
  await externalLink.click({ button: 'middle' });
  await expect(
    page.locator('.help-article-pane .md-app-bar__headline', {
      hasText: /^troubleshooting data problems$/i,
    }),
  ).toBeVisible();
});

test('Settings diagnostics row has no horizontal overflow at 360dp', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await launchApp(page);
  await page.getByRole('button', { name: /^settings$/i }).click();

  // The exact diagnostics supporting-text copy is asserted at the unit level
  // (SettingsSections.test.ts); this build may render the disabled-build fallback copy
  // instead when Sentry is unavailable, so this check only covers layout, not wording.
  const diagnosticsRow = page.getByRole('switch', { name: /error diagnostics/i });
  await expect(diagnosticsRow).toBeVisible();

  const rowBox = await diagnosticsRow.boundingBox();
  expect(rowBox).not.toBeNull();
  if (rowBox) {
    expect(rowBox.x + rowBox.width).toBeLessThanOrEqual(360);
  }

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
