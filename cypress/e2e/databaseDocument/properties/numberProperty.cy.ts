import {
  clearAll,
  createFolder,
  openOPFS,
  unregisterServiceWorkers,
} from '../../repetitiveActions';
import { createDatabaseDocument } from '../createDatabaseDocument';

describe('use number property in database document', () => {
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

  const createNumberProperty = () => {
    cy.findByRole('button', { name: /configure properties/i }).click();

    cy.findByRole('button', { name: /add property/i }).click();

    const propertyName = `number property ${Date.now()}`;

    cy.findByLabelText(/name/i, { selector: 'input' }).type(propertyName);

    cy.findByRole('combobox', { name: /property type/i }).click();

    cy.findByRole('option', { name: /number/i }).click();

    cy.findByRole('button', { name: /create/i }).click();

    cy.findByLabelText(/database properties sheet/i)
      .findByRole('button', { name: /close sheet/ })
      .click();

    return propertyName;
  };

  it('create number property', () => {
    const propertyName = createNumberProperty();
    cy.findAllByText(new RegExp(propertyName, 'i')).should('exist');
  });

  it('edit name number property', () => {
    const propertyName = createNumberProperty();

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

  it('edit default value number property', () => {
    const propertyName = createNumberProperty();

    cy.findByRole('button', { name: /configure properties/i }).click();

    cy.findByRole('button', {
      name: new RegExp(`options ${propertyName}`, 'i'),
    }).click();

    cy.findByRole('menuitem', { name: /edit/i }).click();

    const numberDefaultValue = `${Date.now()}`;

    cy.findByLabelText(/default value/i)
      .focus()
      .type(numberDefaultValue);

    cy.findByRole('button', { name: /edit/i }).click();

    cy.findByLabelText(/database properties sheet/i)
      .findByRole('button', { name: /close sheet/i })
      .click();

    cy.findByRole('button', { name: /add item/i }).click();

    cy.findByRole('button', { name: /add/i }).click();

    cy.findByText(numberDefaultValue).should('exist');
  });

  it('add item with number property', () => {
    const propertyName = createNumberProperty();

    cy.findByRole('button', { name: /add item/i }).click();

    const numberValue = `${Date.now()}`;

    cy.findByLabelText(new RegExp(propertyName, 'i')).type(numberValue);

    cy.findByRole('button', { name: /add/i }).click();

    cy.findByText(numberValue).should('exist');
  });

  it('edit number property of item', () => {
    const propertyName = createNumberProperty();

    cy.findByRole('button', { name: /add item/i }).click();

    const numberValue = `${Date.now()}`;

    cy.findByLabelText(new RegExp(propertyName, 'i')).type(numberValue);

    cy.findByRole('button', { name: /add/i }).click();

    const listitem = cy.findByText(numberValue).closest('[role="listitem"]');

    listitem.findByRole('button', { name: /options/i }).click();

    cy.findByRole('menuitem', { name: /edit/i }).click();

    const editedNumberValue = `${Date.now()}11`;

    cy.findByLabelText(new RegExp(propertyName, 'i'))
      .focus()
      .type(`{selectall}${editedNumberValue}`);

    cy.findByRole('button', { name: /edit/i }).click();

    cy.findByText(editedNumberValue).should('exist');
  });
});
