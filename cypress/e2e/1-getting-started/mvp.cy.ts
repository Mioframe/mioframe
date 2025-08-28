/// <reference types="cypress" />

describe('App Startup', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  afterEach(() => {
    cy.window().then(async (window) => {
      if ('serviceWorker' in window.navigator) {
        const serviceWorkerRegistration =
          await window.navigator.serviceWorker.getRegistrations();
        for (const r of serviceWorkerRegistration) {
          await r.unregister();
        }
      }
    });
  });

  it('load the app and display OPFS', () => {
    cy.contains('Origin private file system').should('be.visible');
  });
});

describe('Directory management', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  before(() => {
    cy.window().then(async () => {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        for (const key of keys) await window.caches.delete(key);
      }

      // Очищаем localStorage и sessionStorage
      window.localStorage.clear();
      window.sessionStorage.clear();

      const rootOpfs = await navigator.storage.getDirectory(); // корневая папка OPFS
      for await (const [name] of rootOpfs.entries()) {
        await rootOpfs.removeEntry(name, { recursive: true });
      }
    });
  });

  after(() => {
    cy.window().then(async (window) => {
      if ('serviceWorker' in window.navigator) {
        const serviceWorkerRegistration =
          await window.navigator.serviceWorker.getRegistrations();
        for (const r of serviceWorkerRegistration) {
          await r.unregister();
        }
      }
    });
  });

  const openOPFS = () => {
    cy.contains('Origin private file system').click();
  };

  it('open OPFS', () => {
    openOPFS();

    cy.url().should('include', 'Origin%20private%20file%20system');
  });

  const createFolder = () => {
    cy.get('[aria-label="Create directory"]').click();

    const folderName = `test folder ${Date.now()}`;

    cy.get('input[aria-label="Folder\'s name"]').type(folderName);

    cy.get('button[aria-label="Create"]').click();

    return folderName;
  };

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
});
