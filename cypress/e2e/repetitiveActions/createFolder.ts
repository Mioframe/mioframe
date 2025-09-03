export const createFolder = () => {
  cy.findByRole('button', { name: /create directory/i }).click();

  const folderName = `test folder ${Date.now()}`;

  cy.findByLabelText(/folder's name/i).type(folderName);

  cy.findByRole('button', { name: /create/i }).click();

  return folderName;
};
