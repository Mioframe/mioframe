import type { Page } from '@playwright/test';

/**
 * @param page - The Playwright page used by the visual test.
 * @param storyId - The stable Storybook story id from `index.json`.
 */
export const openStory = async (page: Page, storyId: string) => {
  const params = new URLSearchParams({ id: storyId, viewMode: 'story' });

  await page.goto(`/iframe.html?${params.toString()}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await stabilizeVisualPage(page);
};

/**
 * @param page - The Playwright page used by the visual test.
 */
export const stabilizeVisualPage = async (page: Page) => {
  await page.evaluate(() => {
    document.documentElement.dataset.visualStable = 'true';
  });
  await page.addStyleTag({
    content: `
      html[data-visual-stable='true'] body *,
      html[data-visual-stable='true'] body *::before,
      html[data-visual-stable='true'] body *::after {
        animation-duration: 0s;
        animation-delay: 0s;
        transition-duration: 0s;
        transition-delay: 0s;
        scroll-behavior: auto;
        caret-color: transparent;
      }
    `,
  });
};
