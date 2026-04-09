import {
  clearAll,
  createFolder,
  openOPFS,
  unregisterServiceWorkers,
} from '../../repetitiveActions';
import { createDatabaseDocument } from '../createDatabaseDocument';
import { faker } from '@faker-js/faker';
import { default as dayjs } from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

describe('use date property in database document', () => {
  after(() => {
    unregisterServiceWorkers();
  });

  before(() => {
    clearAll();
  });

  beforeEach(() => {
    cy.visit('/');

    openOPFS();

    const folderName = createFolder();

    cy.findByText(new RegExp(folderName, 'i')).click();

    const databaseName = createDatabaseDocument();

    cy.findByText(new RegExp(databaseName, 'i')).click();
  });

  const createDateProperty = () => {
    cy.findByRole('button', { name: /configure properties/i }).click();

    cy.findByRole('button', { name: /add property/i }).click();

    const propertyName = `date property ${Date.now()}`;

    cy.findByLabelText(/name/i, { selector: 'input' }).type(propertyName);

    cy.findByRole('combobox', { name: /property type/i }).click();

    cy.findByRole('option', { name: /date/i }).click();

    cy.findByRole('button', { name: /create/i }).click();

    cy.findByLabelText(/database properties sheet/i)
      .findByRole('button', { name: /close sheet/ })
      .click();

    return propertyName;
  };

  it('create date property', () => {
    const propertyName = createDateProperty();
    cy.findAllByText(new RegExp(propertyName, 'i')).should('exist');
  });

  it('edit name date property', () => {
    const propertyName = createDateProperty();

    cy.findByRole('button', { name: /configure properties/i }).click();

    cy.findByRole('button', {
      name: new RegExp(`options ${propertyName}`, 'i'),
    }).click();

    cy.findByRole('menuitem', { name: /edit/i }).click();

    cy.findByLabelText(/name/i, { selector: 'input' }).type(`${propertyName} edited`);

    cy.findByRole('button', { name: /edit/i }).click();

    cy.findByLabelText(/database properties sheet/i)
      .findByRole('button', { name: /close sheet/ })
      .click();

    cy.findAllByText(new RegExp(`${propertyName} edited`, 'i')).should('exist');
  });

  it('edit default value date property', () => {
    const propertyName = createDateProperty();

    cy.findByRole('button', { name: /configure properties/i }).click();

    cy.findByRole('button', {
      name: new RegExp(`options ${propertyName}`, 'i'),
    }).click();

    cy.findByRole('menuitem', { name: /edit/i }).click();

    const dateDefault = faker.date.anytime();

    cy.findByLabelText(/default value/i)
      .focus()
      .type(dayjs(dateDefault).format('YYYY-MM-DD'));

    cy.findByRole('button', { name: /edit/i }).click();

    cy.findByLabelText(/database properties sheet/i)
      .findByRole('button', { name: /close sheet/i })
      .click();

    cy.findByRole('button', { name: /add item/i }).click();

    cy.findByRole('button', { name: /add/i }).click();

    cy.findByText(dayjs(dateDefault).format('l')).should('exist');
  });

  it('add item with date property', () => {
    const propertyName = createDateProperty();

    cy.findByRole('button', { name: /add item/i }).click();

    const dateValue = faker.date.anytime();

    cy.findByLabelText(new RegExp(propertyName, 'i')).type(dayjs(dateValue).format('YYYY-MM-DD'));

    cy.findByRole('button', { name: /add/i }).click();

    cy.findByText(dayjs(dateValue).format('l')).should('exist');
  });

  it('edit date property of item', () => {
    const propertyName = createDateProperty();

    cy.findByRole('button', { name: /add item/i }).click();

    const dateValue = faker.date.anytime();

    cy.findByLabelText(new RegExp(propertyName, 'i')).type(dayjs(dateValue).format('YYYY-MM-DD'));

    cy.findByRole('button', { name: /add/i }).click();

    const listitem = cy.findByText(dayjs(dateValue).format('l')).closest('[role="listitem"]');

    listitem.findByRole('button', { name: /options/i }).click();

    cy.findByRole('menuitem', { name: /edit/i }).click();

    const newDate = faker.date.anytime();

    cy.findByLabelText(new RegExp(propertyName, 'i'))
      .focus()
      .type(dayjs(newDate).format('YYYY-MM-DD'));

    cy.findByRole('button', { name: /edit/i }).click();

    cy.findByText(dayjs(newDate).format('l')).should('exist');
  });
});
