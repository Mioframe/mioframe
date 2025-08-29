import { preparationApp } from '../preparation';
import { openOPFS } from '../openOPFS';

describe('Document management', () => {
  preparationApp();

  it('Create document', () => {
    openOPFS();

    cy.findByRole('button', { name: /create document/i }).click();

    const newName = `new document ${Date.now()}`;

    cy.findByLabelText('Name').type(newName);

    cy.findByRole('button', { name: /create/i }).click();

    cy.findByText(newName).should('exist');
  });
});
