import { clearAll } from '../repetitiveActions/clearAll';
import { unregisterServiceWorkers } from '../repetitiveActions/unregisterServiceWorkers';
import { openOPFS } from '../repetitiveActions/openOPFS';

const createDocument = () => {
  cy.findByRole('button', { name: /create document/i }).click();

  const newName = `new document ${Date.now()}`;

  cy.findByLabelText('Name').type(newName);

  cy.findByRole('button', { name: /create/i }).click();

  return newName;
};

describe('Document management', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  before(() => {
    clearAll();
  });

  after(() => {
    unregisterServiceWorkers();
  });

  it('Create document', () => {
    openOPFS();

    const name = createDocument();

    cy.findByText(name).should('exist');
  });

  it('Remove document', () => {
    openOPFS();

    const name = createDocument();

    cy.findByRole('button', {
      name: new RegExp(`options ${name}`, 'i'),
    }).click();

    cy.findByRole('menuitem', { name: /remove/i }).click();

    cy.findByRole('button', { name: /remove/i }).click();

    cy.findByText(name).should('not.exist');
  });

  it('Rename document', () => {
    openOPFS();

    const name = createDocument();

    cy.findByRole('button', {
      name: new RegExp(`options ${name}`, 'i'),
    }).click();

    cy.findByRole('menuitem', { name: /rename/i }).click();

    const newName = `new document name ${Date.now()}`;

    cy.findByLabelText(/name/i, { selector: 'input' }).type(newName);

    cy.findByRole('button', { name: /rename/i }).click();

    cy.findByText(name).should('not.exist');

    cy.findByText(newName).should('exist');
  });
});
