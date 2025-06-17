import { createGlobalState, useStorage } from '@vueuse/core';
import type { ValueOf } from 'type-fest';
import { merge } from 'es-toolkit';
import { computed } from 'vue';
import { objectEntries } from '@shared/lib/objectEntries';

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
    {
      mergeDefaults: (storage, defaults) => merge(storage, defaults),
    },
  );

  const iconNames = (nameSet: string[]) =>
    nameSet
      .filter((v) => !!v)
      .sort()
      .join(',');

  const links = computed(() => {
    return objectEntries(state.value).reduce(
      (
        acc: {
          key?: string;
          rel: 'stylesheet';
          href: string;
        }[],
        [family, names],
      ) => {
        if (names.length) {
          acc.push({
            key: `stylesheet${family}`,
            rel: 'stylesheet',
            href: `${fontsUrl}?family=${family}:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${iconNames(names)}`,
          });
        }

        return acc;
      },
      [],
    );
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
  };

  // useHead don't work in global state
  // useHead({
  //   link: links,
  // });

  return {
    links,
    push,
  };
});
