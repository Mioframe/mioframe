export const createProperty = () => {
  cy.findByRole('button', { name: /configure properties/i }).click();

  cy.findByRole('button', { name: /add property/i }).click();

  const propertyName = `property ${Date.now()}`;

  cy.findByLabelText(/name/i, { selector: 'input' }).type(propertyName);

  cy.findByRole('button', { name: /create/i }).click();

  return propertyName;
};
