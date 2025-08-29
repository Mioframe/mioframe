/// <reference types="cypress" />

import { preparationApp } from '../preparation';

describe('App Startup', () => {
  preparationApp();

  it('load the app and display OPFS', () => {
    cy.contains('Origin private file system').should('be.visible');
  });
});
