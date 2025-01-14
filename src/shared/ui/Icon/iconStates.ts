import { useHead } from '@unhead/vue';
import { isNil } from 'lodash-es';
import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

export const useIconStates = defineStore('iconStates', () => {
  const fontsUrl = 'https://fonts.googleapis.com/css2';

  const roundedSymbolNameSet = reactive<Set<string>>(new Set());

  const symbolRoundedLink = computed(() =>
    roundedSymbolNameSet.size
      ? {
          rel: 'stylesheet',
          href: `${fontsUrl}?family=Material+Symbols+Rounded&icon_names=${[...roundedSymbolNameSet.values()].sort().join(',')}`,
        }
      : undefined,
  );

  const outlinedSymbolNameSet = reactive<Set<string>>(new Set());

  const symbolOutlinedLink = computed(() =>
    outlinedSymbolNameSet.size
      ? {
          rel: 'stylesheet',
          href: `${fontsUrl}?family=Material+Symbols+Outlined&icon_names=${[...outlinedSymbolNameSet.values()].sort().join(',')}`,
        }
      : undefined,
  );

  const sharpSymbolNameSet = reactive<Set<string>>(new Set());

  const symbolSharpLink = computed(() =>
    sharpSymbolNameSet.size
      ? {
          rel: 'stylesheet',
          href: `${fontsUrl}?family=Material+Symbols+Sharp&icon_names=${[...sharpSymbolNameSet.values()].sort().join(',')}`,
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
      case 'rounded':
        roundedSymbolNameSet.add(symbolName);
        break;
      case 'outlined':
        outlinedSymbolNameSet.add(symbolName);
        break;
      case 'sharp':
        sharpSymbolNameSet.add(symbolName);
        break;
    }
  };

  return {
    loadSymbol,
  };
});
