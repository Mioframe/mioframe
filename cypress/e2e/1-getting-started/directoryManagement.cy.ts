import { clearAll } from '../repetitiveActions/clearAll';
import { unregisterServiceWorkers } from '../repetitiveActions/unregisterServiceWorkers';
import { openOPFS } from '../repetitiveActions/openOPFS';
import { createFolder } from '../repetitiveActions/createFolder';

describe('Directory management', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  before(() => {
    clearAll();
  });

  after(() => {
    unregisterServiceWorkers();
  });

  it('open OPFS', () => {
    openOPFS();

    cy.url().should('include', 'Origin%20private%20file%20system');
  });

  it('Create first folder', () => {
    openOPFS();

    const folderName = createFolder();

    cy.get('.document-explorer-widget').should('contain.text', folderName);
  });

  it('Remove folder', () => {
    openOPFS();

    const folderName = createFolder();

    cy.get(`[aria-label="options ${folderName}"]`).click();

    cy.get(`[aria-label="options ${folderName} menu"]`)
      .contains('remove', { matchCase: false })
      .click();

    cy.get('dialog').contains('button', 'remove', { matchCase: false }).click();

    cy.contains(folderName).should('not.exist');
  });

  it('Create two folders', () => {
    openOPFS();
    const folderName1 = createFolder();
    const folderName2 = createFolder();

    cy.contains(folderName1).should('exist');
    cy.contains(folderName2).should('exist');
  });

  it('Rename folder', () => {
    openOPFS();
    const folderName = createFolder();

    cy.get(`[aria-label="options ${folderName}"]`).click();

    cy.get(`[aria-label="options ${folderName} menu"]`)
      .contains('rename', { matchCase: false })
      .click();

    const newName = `new name ${Date.now()}`;

    cy.findByRole('textbox', {
      name: /name/i,
    }).type(newName);

    cy.get('button').contains('rename', { matchCase: false }).click();

    cy.contains(newName).should('exist');
  });

  it('Create subfolder', () => {
    openOPFS();
    const folderName = createFolder();
    cy.contains(folderName).click();

    const subfolderName = createFolder();

    cy.contains(subfolderName).should('exist');
  });
});
