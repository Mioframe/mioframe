export const clearAll = () => {
  cy.window().then(async () => {
    if ('caches' in window) {
      const keys = await window.caches.keys();
      for (const key of keys) await window.caches.delete(key);
    }

    // Очищаем localStorage и sessionStorage
    window.localStorage.clear();
    window.sessionStorage.clear();

    if (navigator.storage) {
      const rootOpfs = await navigator.storage.getDirectory(); // корневая папка OPFS
      for await (const [name] of rootOpfs.entries()) {
        await rootOpfs.removeEntry(name, { recursive: true });
      }
    }
  });
};
