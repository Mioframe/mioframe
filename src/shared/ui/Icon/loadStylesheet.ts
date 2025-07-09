export interface StylesheetHandle {
  link: HTMLLinkElement;
  /**
   * Удаляет <link> из <head>, останавливая использование стилей.
   * Если вы хотите просто отключить, вместо удаления можно выставить disabled = true.
   */
  unload: () => void;
}

/**
 * Динамически загружает CSS-файл и позволяет отследить события загрузки/ошибки.
 * @param href URL подключаемого стиля.
 * @returns Promise, который резолвится с объектом handle или реджектится с ошибкой загрузки.
 */
export const loadStylesheet = (href: string): Promise<StylesheetHandle> =>
  new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.crossOrigin = 'anonymous';
    link.href = href;

    link.onload = () => {
      resolve({
        link,
        unload: () => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        },
      });
    };

    link.onerror = () => {
      reject(new Error(`Failed to load stylesheet: ${href}`));
    };

    document.head.appendChild(link);
  });
