import { createFolder } from '../../repetitiveActions/createFolder';
import { createProperty } from '../../repetitiveActions/createProperty';
import { openOPFS } from '../../repetitiveActions/openOPFS';
import { clearAll } from '../../repetitiveActions/clearAll';
import { unregisterServiceWorkers } from '../../repetitiveActions/unregisterServiceWorkers';
import { createDatabaseDocument } from '../createDatabaseDocument';

describe('use property in database document', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  before(() => {
    clearAll();
  });

  after(() => {
    unregisterServiceWorkers();
  });

  it('create property in database document', () => {
    openOPFS();

    const folderName = createFolder();

    cy.findByText(new RegExp(folderName, 'i')).click();

    const databaseName = createDatabaseDocument();

    cy.findByText(new RegExp(databaseName, 'i')).click();

    const propertyName = createProperty();

    cy.findAllByText(new RegExp(propertyName, 'i')).should('exist');
  });

  it('remove property in database document', () => {
    openOPFS();

    const folderName = createFolder();

    cy.findByText(new RegExp(folderName, 'i')).click();

    const databaseName = createDatabaseDocument();

    cy.findByText(new RegExp(databaseName, 'i')).click();

    const propertyName = createProperty();

    cy.findByRole('button', {
      name: new RegExp(`options ${propertyName}`, 'i'),
    }).click();

    cy.findByRole('menuitem', { name: /remove/i }).click();

    cy.findByRole('button', { name: /remove/i }).click();

    cy.findByText(new RegExp(propertyName, 'i')).should('not.exist');
  });

  // TODO: edit name property
});
