import {
  clearAll,
  createFolder,
  openOPFS,
  unregisterServiceWorkers,
} from '../../repetitiveActions';
import { createDatabaseDocument } from '../createDatabaseDocument';
import { default as dayjs } from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

describe('use boolean property in database document', () => {
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

  const createBooleanProperty = () => {
    cy.findByRole('button', { name: /configure properties/i }).click();

    cy.findByRole('button', { name: /add property/i }).click();

    const propertyName = `boolean property ${Date.now()}`;

    cy.findByLabelText(/name/i, { selector: 'input' }).type(propertyName);

    cy.findByRole('combobox', { name: /property type/i }).click();

    cy.findByRole('option', { name: /boolean/i }).click();

    cy.findByRole('button', { name: /create/i }).click();

    cy.findByLabelText(/database properties sheet/i)
      .findByRole('button', { name: /close sheet/ })
      .click();

    return propertyName;
  };

  it('create boolean property', () => {
    const propertyName = createBooleanProperty();
    cy.findAllByText(new RegExp(propertyName, 'i')).should('exist');
  });

  it('edit name boolean property', () => {
    const propertyName = createBooleanProperty();

    cy.findByRole('button', { name: /configure properties/i }).click();

    cy.findByRole('button', {
      name: new RegExp(`options ${propertyName}`, 'i'),
    }).click();

    cy.findByRole('menuitem', { name: /edit/i }).click();

    cy.findByLabelText(/name/i, { selector: 'input' }).type(
      `${propertyName} edited`,
    );

    cy.findByRole('button', { name: /edit/i }).click();

    cy.findByLabelText(/database properties sheet/i)
      .findByRole('button', { name: /close sheet/ })
      .click();

    cy.findAllByText(new RegExp(`${propertyName} edited`, 'i')).should('exist');
  });

  it('edit default value boolean property', () => {
    const propertyName = createBooleanProperty();

    cy.findByRole('button', { name: /configure properties/i }).click();

    cy.findByRole('button', {
      name: new RegExp(`options ${propertyName}`, 'i'),
    }).click();

    cy.findByRole('menuitem', { name: /edit/i }).click();

    cy.findByRole('checkbox', { name: /default value/i }).check({
      force: true,
    });

    cy.findByRole('button', { name: /edit/i }).click();

    cy.findByLabelText(/database properties sheet/i)
      .findByRole('button', { name: /close sheet/i })
      .click();

    cy.findByRole('button', { name: /add item/i }).click();

    cy.findByRole('button', { name: /add/i }).click();

    cy.findByRole('checkbox', { name: new RegExp(propertyName, 'i') }).should(
      'be.checked',
    );
  });

  it('add item with boolean property', () => {
    const propertyName = createBooleanProperty();

    cy.findByRole('button', { name: /add item/i }).click();

    cy.findByRole('checkbox', { name: new RegExp(propertyName, 'i') }).check({
      force: true,
    });

    cy.findByRole('button', { name: /add/i }).click();

    cy.findByRole('checkbox', { name: new RegExp(propertyName, 'i') }).should(
      'be.checked',
    );
  });

  it('edit boolean property of item', () => {
    const propertyName = createBooleanProperty();

    cy.findByRole('button', { name: /add item/i }).click();

    cy.findByLabelText(new RegExp(propertyName, 'i')).check({ force: true });

    cy.findByRole('button', { name: /add/i }).click();

    const listitem = cy
      .findByLabelText(new RegExp(propertyName, 'i'))
      .closest('[role="listitem"]');

    listitem.findByRole('button', { name: /options/i }).click();

    cy.findByRole('menuitem', { name: /edit/i }).click();

    cy.findByRole('checkbox', { name: new RegExp(propertyName, 'i') }).check({
      force: true,
    });

    cy.findByRole('button', { name: /edit/i }).click();

    cy.findByRole('checkbox', { name: new RegExp(propertyName, 'i') }).should(
      'be.checked',
    );
  });
});
