export const unregisterServiceWorkers = () => {
  cy.window().then(async (window) => {
    if ('serviceWorker' in window.navigator) {
      const serviceWorkerRegistration =
        await window.navigator.serviceWorker.getRegistrations();
      for (const r of serviceWorkerRegistration) {
        await r.unregister();
      }
    }
  });
};
