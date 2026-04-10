import {
  clearAll,
  createFolder,
  openOPFS,
  unregisterServiceWorkers,
} from '../../repetitiveActions';
import { createDatabaseDocument } from '../createDatabaseDocument';

describe('use string property in database document', () => {
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

  const createStringProperty = () => {
    cy.findByRole('button', { name: /configure properties/i }).click();

    cy.findByRole('button', { name: /add property/i }).click();

    const propertyName = `string property ${Date.now()}`;

    cy.findByLabelText(/name/i, { selector: 'input' }).type(propertyName);

    cy.findByRole('combobox', { name: /property type/i }).click();

    cy.findByRole('option', { name: /string/i }).click();

    cy.findByRole('button', { name: /create/i }).click();

    cy.findByLabelText(/database properties sheet/i)
      .findByRole('button', { name: /close sheet/ })
      .click();

    return propertyName;
  };

  it('create string property', () => {
    const propertyName = createStringProperty();
    cy.findAllByText(new RegExp(propertyName, 'i')).should('exist');
  });

  it('edit name string property', () => {
    const propertyName = createStringProperty();

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

  it('edit default value string property', () => {
    const propertyName = createStringProperty();

    cy.findByRole('button', { name: /configure properties/i }).click();

    cy.findByRole('button', {
      name: new RegExp(`options ${propertyName}`, 'i'),
    }).click();

    cy.findByRole('menuitem', { name: /edit/i }).click();

    const stringDefaultValue = `default value ${Date.now()}`;

    cy.findByLabelText(/default value/i)
      .focus()
      .type(stringDefaultValue);

    cy.findByRole('button', { name: /edit/i }).click();

    cy.findByLabelText(/database properties sheet/i)
      .findByRole('button', { name: /close sheet/i })
      .click();

    cy.findByRole('button', { name: /add item/i }).click();

    cy.findByRole('button', { name: /add/i }).click();

    cy.findByText(stringDefaultValue).should('exist');
  });

  it('add item with string property', () => {
    const propertyName = createStringProperty();

    cy.findByRole('button', { name: /add item/i }).click();

    const stringValue = `string value ${Date.now()}`;

    cy.findByLabelText(new RegExp(propertyName, 'i')).type(stringValue);

    cy.findByRole('button', { name: /add/i }).click();

    cy.findByText(stringValue).should('exist');
  });

  it('edit string property of item', () => {
    const propertyName = createStringProperty();

    cy.findByRole('button', { name: /add item/i }).click();

    const stringValue = `string value ${Date.now()}`;

    cy.findByLabelText(new RegExp(propertyName, 'i')).type(stringValue);

    cy.findByRole('button', { name: /add/i }).click();

    const listitem = cy.findByText(stringValue).closest('[role="listitem"]');

    listitem.findByRole('button', { name: /options/i }).click();

    cy.findByRole('menuitem', { name: /edit/i }).click();

    const editedStringValue = `edited ${stringValue}`;

    cy.findByLabelText(new RegExp(propertyName, 'i')).clear().type(editedStringValue);

    cy.findByRole('button', { name: /edit/i }).click();

    cy.findByText(editedStringValue).should('exist');
  });
});
