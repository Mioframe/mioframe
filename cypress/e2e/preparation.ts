export const preparationApp = () => {
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
};
