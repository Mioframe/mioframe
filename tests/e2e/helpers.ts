import { expect, type Page } from '@playwright/test';

export const createUniqueName = (prefix: string) =>
  `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const completeStorageOnboarding = async (page: Page) => {
  for (let step = 0; step < 5; step += 1) {
    const okButton = page.getByRole('dialog').getByRole('button', { name: /^ok$/i }).first();
    const isVisible = await okButton.isVisible().catch(() => false);

    if (!isVisible) {
      return;
    }

    await okButton.click();
  }
};

export const openOpfs = async (page: Page) => {
  const opfsEntry = page.getByText(/origin private file system/i).first();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await completeStorageOnboarding(page);

    try {
      await opfsEntry.click();
      break;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
    }
  }

  await expect(page).toHaveURL(/Origin%20private%20file%20system/);
};

export const createDirectory = async (page: Page, name = createUniqueName('folder')) => {
  await page.getByRole('button', { name: /create directory/i }).click();
  await page.getByLabel(/folder's name/i).fill(name);
  await page.getByRole('button', { name: /^create$/i }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  return name;
};

export const renameEntry = async (page: Page, currentName: string, nextName: string) => {
  await page.getByRole('button', { name: new RegExp(`options ${currentName}`, 'i') }).click();
  await page.getByRole('menuitem', { name: /rename/i }).click();
  await page.getByRole('textbox', { name: /name/i }).fill(nextName);
  await page.getByRole('button', { name: /^rename$/i }).click();
  await expect(page.getByText(nextName, { exact: true })).toBeVisible();
};

export const removeEntry = async (page: Page, name: string) => {
  await page.getByRole('button', { name: new RegExp(`options ${name}`, 'i') }).click();
  await page.getByRole('menuitem', { name: /remove/i }).click();
  await page.getByRole('button', { name: /^remove$/i }).click();
  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
};

export const createDatabaseDocument = async (
  page: Page,
  name = createUniqueName('database document'),
) => {
  await page.getByRole('button', { name: /create document/i }).click();
  await page.getByLabel(/name/i).fill(name);
  await page.getByRole('button', { name: /^create$/i }).click();
  await expect(page.getByRole('dialog', { name: /create document/i })).toHaveCount(0);
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  return name;
};

export const createStringProperty = async (
  page: Page,
  name = createUniqueName('string property'),
) => {
  await page.getByRole('button', { name: /configure properties/i }).click();
  await page.getByRole('button', { name: /add property/i }).click();
  await page.getByLabel(/^name$/i).fill(name);
  await page.getByRole('button', { name: /^create$/i }).click();
  await expect(page.getByRole('dialog', { name: /create property/i })).toHaveCount(0);
  await page
    .getByLabel(/database properties sheet/i)
    .getByRole('button', { name: /close sheet/i })
    .click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  return name;
};
