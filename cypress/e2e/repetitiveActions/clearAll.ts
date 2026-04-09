export const clearAll = () => {
  cy.window().then(async () => {
    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }

    // Очищаем localStorage и sessionStorage
    window.localStorage.clear();
    window.sessionStorage.clear();

    if (navigator.storage) {
      const rootOpfs = await navigator.storage.getDirectory(); // корневая папка OPFS
      const entryNames: string[] = [];

      for await (const [name] of rootOpfs.entries()) {
        entryNames.push(name);
      }

      await Promise.all(
        entryNames.map((name) => rootOpfs.removeEntry(name, { recursive: true })),
      );
    }
  });
};
