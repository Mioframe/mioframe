export const createDatabaseDocument = () => {
  cy.findByRole('button', { name: /create document/i }).click();

  const databaseName = `database document ${Date.now()}`;

  cy.findByLabelText(/name/i, { selector: 'input' }).type(databaseName);

  cy.findByRole('combobox', { name: /Document type/i }).click();

  cy.findByRole('option', { name: /database/i }).click();

  cy.findByRole('button', { name: /create/i }).click();

  return databaseName;
};
