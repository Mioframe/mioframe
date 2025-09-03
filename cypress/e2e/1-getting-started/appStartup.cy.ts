import { clearAll } from '../repetitiveActions/clearAll';
import { unregisterServiceWorkers } from '../repetitiveActions/unregisterServiceWorkers';

describe('App Startup', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  before(() => {
    clearAll();
  });

  after(() => {
    unregisterServiceWorkers();
  });

  it('load the app and display OPFS', () => {
    cy.contains('Origin private file system').should('be.visible');
  });
});
