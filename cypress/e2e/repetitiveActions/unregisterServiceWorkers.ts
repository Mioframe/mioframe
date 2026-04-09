export const unregisterServiceWorkers = () => {
  cy.window().then(async (window) => {
    if ('serviceWorker' in window.navigator) {
      const serviceWorkerRegistration = await window.navigator.serviceWorker.getRegistrations();
      await Promise.all(serviceWorkerRegistration.map((registration) => registration.unregister()));
    }
  });
};
