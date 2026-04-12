import { expect, type Page } from '@playwright/test';

export const createUniqueName = (prefix: string) =>
  `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const openOpfs = async (page: Page) => {
  await page.getByText('Origin private file system', { exact: true }).click();
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
  await page.getByRole('combobox', { name: /document type/i }).click();
  await page.getByRole('option', { name: /database/i }).click();
  await page.getByRole('button', { name: /^create$/i }).click();
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
  await page.getByRole('combobox', { name: /property type/i }).click();
  await page.getByRole('option', { name: /string/i }).click();
  await page.getByRole('button', { name: /^create$/i }).click();
  await page
    .getByLabel(/database properties sheet/i)
    .getByRole('button', { name: /close sheet/i })
    .click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  return name;
};
