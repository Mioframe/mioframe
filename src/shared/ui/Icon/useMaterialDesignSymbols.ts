import { createGlobalState, tryOnScopeDispose, useStorage } from '@vueuse/core';
import { debounce, merge, uniq } from 'es-toolkit';
import type { Ref } from 'vue';
import { ref, shallowReactive, watch } from 'vue';
import { array, object, string } from 'zod/v4-mini';
import qs from 'query-string';
import { loadStylesheet } from './loadStylesheet';

const searchStylesheetLinks = (href: string) =>
  document.querySelectorAll(`link[href*="${href}"]`);

const awaitFont = async (fontName: string) => {
  await document.fonts.load(`1em "${fontName}"`);
};

export const useIconStates = createGlobalState(() => {
  const url = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap`;

  const symbolsUsed = useStorage<string[]>(
    'MaterialSymbolsRounded',
    [],
    localStorage,
    { mergeDefaults: merge },
  );
  const loadedSymbols = shallowReactive(new Set<string>());
  const loadingSymbols = shallowReactive(new Set<string>());

  searchStylesheetLinks(url).forEach((el) => {
    if (el instanceof HTMLLinkElement) {
      const { data: { icon_names } = {} } = object({
        icon_names: array(string()),
      }).safeParse(qs.parse(el.href));

      if (icon_names) {
        icon_names.forEach((name) => {
          if (name) {
            loadedSymbols.add(name);
          }
        });
      }
    }
  });

  const isEdgeOnAndroid = (ua = navigator.userAgent) => {
    const isAndroid = /\bAndroid\b/i.test(ua);
    const isEdgeA = /\bEdgA\/\d+/i.test(ua);
    return isAndroid && isEdgeA;
  };

  const loadedAllSymbols = ref(false);

  const loadFont = async () => {
    const names = uniq([...loadedSymbols.values(), ...symbolsUsed.value]);
    if (names.length) {
      names.sort();
      names.forEach((name) => {
        if (!loadedSymbols.has(name)) {
          loadingSymbols.add(name);
        }
      });

      const oldLinks = searchStylesheetLinks(url);

      if (!loadedAllSymbols.value) {
        try {
          if (isEdgeOnAndroid()) {
            await import('material-symbols/rounded.css');
            loadedAllSymbols.value = true;
          } else {
            await loadStylesheet(`${url}&icon_names=${names.join(',')}`);
          }
          await awaitFont('Material Symbols Rounded');
        } catch {
          symbolsUsed.value.length = 0;
          symbolsUsed.value = Array.from(usedSymbols).sort();
        }
      }

      oldLinks.forEach((el) => {
        el.remove();
      });

      names.forEach((name) => {
        loadingSymbols.delete(name);
        loadedSymbols.add(name);
      });
    }
  };

  const debounceLoadFond = debounce(loadFont, 500, {
    edges: ['leading', 'trailing'],
  });

  watch(symbolsUsed, debounceLoadFond, { immediate: true, deep: true });

  const usedSymbols = new Set<string>();

  const addLoadSymbol = (name: string) => {
    usedSymbols.add(name);

    if (!symbolsUsed.value.includes(name)) {
      symbolsUsed.value.push(name);
    }
  };

  const useLoadSymbol = (name: Ref<string>) => {
    watch(
      name,
      (name, oldName) => {
        if (oldName) {
          usedSymbols.delete(oldName);
        }

        addLoadSymbol(name);
      },
      { immediate: true },
    );

    tryOnScopeDispose(() => {
      usedSymbols.delete(name.value);
    });
  };

  return {
    useLoadSymbol,
    loadedSymbols,
  };
});
