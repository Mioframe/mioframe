import { createLogger } from '@shared/lib/logger';
import { useHead } from '@unhead/vue';
import { createGlobalState, useStorage } from '@vueuse/core';
import { merge } from 'lodash-es';
import type { Entries, ValueOf } from 'type-fest';
import { computed } from 'vue';

const { debug, watchDebug } = createLogger('iconStates');

export const MaterialSymbolsFamily = {
  Rounded: 'Material+Symbols+Rounded',
  Outlined: 'Material+Symbols+Outlined',
  Sharp: 'Material+Symbols+Sharp',
} as const;

type State = {
  [K in ValueOf<typeof MaterialSymbolsFamily>]: string[];
};

export const useIconStates = createGlobalState(() => {
  const fontsUrl = 'https://fonts.googleapis.com/css2';

  const state = useStorage<State>(
    'UsedMaterialSymbols',
    {
      [MaterialSymbolsFamily.Outlined]: [],
      [MaterialSymbolsFamily.Rounded]: [],
      [MaterialSymbolsFamily.Sharp]: [],
    },
    localStorage,
    { mergeDefaults: (storage, defaults) => merge(storage, defaults) },
  );

  const iconNames = (nameSet: string[]) =>
    nameSet
      .filter((v) => !!v)
      .sort()
      .join(',');

  const links = computed(() =>
    (<Entries<State>>Object.entries(state.value)).reduce<
      {
        rel: 'stylesheet';
        href: string;
      }[]
    >((acc, [family, names]) => {
      if (names.length) {
        acc.push({
          rel: 'stylesheet',
          href: `${fontsUrl}?family=${family}&icon_names=${iconNames(names)}`,
        });
      }
      return acc;
    }, []),
  );

  useHead({
    link: () => links.value,
  });

  watchDebug('links', links);

  const push = (
    family: ValueOf<typeof MaterialSymbolsFamily>,
    name: string,
  ) => {
    debug('push', state);
    if (name.length) {
      const names = state.value[family];
      if (!names.includes(name)) {
        names.push(name);
        names.sort();
      }
    }
  };

  return {
    links,
    push,
  };
});
