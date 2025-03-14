import { useHead } from '@unhead/vue';
import { useStorage } from '@vueuse/core';
import { isNil } from 'lodash-es';
import { defineStore } from 'pinia';
import { computed } from 'vue';

export const useIconStates = defineStore('iconStates', () => {
  const fontsUrl = 'https://fonts.googleapis.com/css2';

  const roundedSymbolNameSet = useStorage<string[]>('roundedSymbolNameSet', []);

  const symbolRoundedLink = computed(() =>
    roundedSymbolNameSet.value.length
      ? {
          rel: 'stylesheet',
          href: `${fontsUrl}?family=Material+Symbols+Rounded&icon_names=${roundedSymbolNameSet.value.sort().join(',')}`,
        }
      : undefined,
  );

  const outlinedSymbolNameSet = useStorage<string[]>(
    'outlinedSymbolNameSet',
    [],
  );

  const symbolOutlinedLink = computed(() =>
    outlinedSymbolNameSet.value.length
      ? {
          rel: 'stylesheet',
          href: `${fontsUrl}?family=Material+Symbols+Outlined&icon_names=${outlinedSymbolNameSet.value.sort().join(',')}`,
        }
      : undefined,
  );

  const sharpSymbolNameSet = useStorage<string[]>('sharpSymbolNameSet', []);

  const symbolSharpLink = computed(() =>
    sharpSymbolNameSet.value.length
      ? {
          rel: 'stylesheet',
          href: `${fontsUrl}?family=Material+Symbols+Sharp&icon_names=${sharpSymbolNameSet.value.sort().join(',')}`,
        }
      : undefined,
  );

  useHead(
    computed(() => ({
      link: [
        symbolRoundedLink.value,
        symbolOutlinedLink.value,
        symbolSharpLink.value,
      ].filter((v) => !isNil(v)),
    })),
  );

  const loadSymbol = (
    styleName: 'rounded' | 'outlined' | 'sharp',
    symbolName: string,
  ) => {
    switch (styleName) {
      case 'rounded': {
        if (!roundedSymbolNameSet.value.includes(symbolName)) {
          roundedSymbolNameSet.value.push(symbolName);
        }
        break;
      }
      case 'outlined': {
        if (!outlinedSymbolNameSet.value.includes(symbolName)) {
          outlinedSymbolNameSet.value.push(symbolName);
        }
        break;
      }
      case 'sharp': {
        if (!sharpSymbolNameSet.value.includes(symbolName)) {
          sharpSymbolNameSet.value.push(symbolName);
        }
        break;
      }
    }
  };

  return {
    loadSymbol,
  };
});
