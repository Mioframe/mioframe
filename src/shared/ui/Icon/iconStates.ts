import { useReduce } from '@shared/lib/useReduce';
import { useHead } from '@unhead/vue';
import { createGlobalState, useStorage } from '@vueuse/core';
import { merge } from 'lodash-es';
import type { Entries, ValueOf } from 'type-fest';
import { computed } from 'vue';

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

  const stateEntries = computed(
    () => <Entries<State>>Object.entries(state.value),
  );

  const links = useReduce(
    stateEntries,
    (
      acc: {
        key: string;
        rel: 'stylesheet';
        href: string;
      }[],
      [family, names],
    ) => {
      if (names.length) {
        acc.push({
          key: `stylesheet${family}`,
          rel: 'stylesheet',
          href: `${fontsUrl}?family=${family}&icon_names=${iconNames(names)}`,
        });
      }
    },
    [],
  );

  const head = useHead({
    link: links,
  });

  const push = (
    family: ValueOf<typeof MaterialSymbolsFamily>,
    name: string,
  ) => {
    if (name.length) {
      const names = state.value[family];
      if (!names.includes(name)) {
        names.push(name);
        names.sort();
      }
    }
    head.patch({
      link: links.value,
    });
  };

  return {
    links,
    push,
  };
});
