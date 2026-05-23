import { expect, test } from '@playwright/test';
import { createDirectory, createUniqueName, launchApp, openDirectory, openOpfs } from './helpers';

test('repo explorer keeps document and file actions separate on a compact viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('workspace'));
  await openDirectory(page, directoryName);

  const currentDirectoryMenu = page.getByRole('button', {
    name: new RegExp(`^options ${directoryName}$`, 'i'),
  });

  await expect(currentDirectoryMenu).toBeVisible();
  await expect(page.getByRole('button', { name: /^home$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^all changes saved$/i })).toHaveCount(0);
  await expect(page.getByText(/^storage status$/i)).toHaveCount(0);

  await currentDirectoryMenu.click();
  await expect(page.getByRole('menuitem', { name: /^create directory$/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^create document$/i })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: /^import json$/i })).toHaveCount(0);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /^add document$/i }).click();

  const addSheet = page.getByRole('dialog', { name: /^add document$/i });
  await expect(addSheet).toBeVisible();
  await addSheet.getByRole('button', { name: /create new document/i }).click();
  await expect(addSheet).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: /^create document$/i })).toBeVisible();
});

test('repo explorer breadcrumb remains horizontally scrollable on a compact viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await launchApp(page);
  await openOpfs(page);

  const pathNames = [
    createUniqueName('workspace collection'),
    createUniqueName('long nested folder'),
    createUniqueName('deeper mobile folder'),
  ];

  for (const pathName of pathNames) {
    // Each step depends on the previous directory being created and opened first.
    // eslint-disable-next-line no-await-in-loop -- each created directory becomes the next navigation target
    await createDirectory(page, pathName);
    // eslint-disable-next-line no-await-in-loop -- each directory must open before the next child is created
    await openDirectory(page, pathName);
  }

  const deepestPathName = pathNames.at(-1);

  if (!deepestPathName) {
    throw new Error('Expected a deepest breadcrumb path name');
  }

  const breadcrumb = page.locator('.md-navigation-path');
  await expect(breadcrumb).toBeVisible();
  await expect(page.getByRole('button', { name: /^home$/i })).toHaveCount(1);
  await expect(page.getByRole('button', { name: deepestPathName, exact: true })).toHaveCount(0);

  const breadcrumbLabels = await breadcrumb
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((button) => button.textContent.trim()));

  expect(breadcrumbLabels.every((label, index) => index === 0 || label.length > 0)).toBe(true);
  expect(breadcrumbLabels).toContain(pathNames[0]);
  expect(breadcrumbLabels).toContain(pathNames[1]);

  const hasHorizontalOverflow = await breadcrumb.evaluate((element) => {
    return element.scrollWidth > element.clientWidth;
  });

  expect(hasHorizontalOverflow).toBe(true);
  await expect(page.getByText(deepestPathName, { exact: true })).toHaveCount(1);
});
