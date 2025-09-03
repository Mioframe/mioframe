import { createFolder } from '../repetitiveActions/createFolder';
import { openOPFS } from '../repetitiveActions/openOPFS';
import { clearAll } from '../repetitiveActions/clearAll';
import { unregisterServiceWorkers } from '../repetitiveActions/unregisterServiceWorkers';
import { createDatabaseDocument } from './createDatabaseDocument';

describe('use database document', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  before(() => {
    clearAll();
  });

  after(() => {
    unregisterServiceWorkers();
  });

  it('create database document', () => {
    openOPFS();

    const folderName = createFolder();

    cy.findByText(new RegExp(folderName, 'i')).click();

    const databaseName = createDatabaseDocument();

    cy.findByText(new RegExp(databaseName, 'i')).should('exist');
  });

  it('open database document', () => {
    openOPFS();

    const folderName = createFolder();

    cy.findByText(new RegExp(folderName, 'i')).click();

    const databaseName = createDatabaseDocument();

    cy.findByText(new RegExp(databaseName, 'i')).click();

    cy.findByRole('button', { name: /configure properties/i }).should('exist');
  });
});
