import { tryOnScopeDispose } from '@vueuse/core';
import type { InjectionKey, Ref } from 'vue';
import { computed, inject, provide, shallowRef, watch } from 'vue';

const KEY: InjectionKey<{ numberOfBottomNavigationBans: Ref<number> }> =
  Symbol('allowedBottomNavigation');

/**
 * Разрешение на отображение нижней панели навигации вместе с отображаемыми Pane.
 *
 * @description Создаёт реестр разрешений на использование нижнего бара навигации с размещёнными Pane
 */
export const useAllowedBottomNavigation = () => {
  const state = {
    numberOfBottomNavigationBans: shallowRef(0),
  };

  provide(KEY, state);

  return {
    allowed: computed(() => state.numberOfBottomNavigationBans.value === 0),
  };
};

/**
 * Даёт разрешение на использование нижнего бара навигации с определённым Pane
 * @param allowed разрешение отображать нижний бар навигации
 * @description Реестр разрешений определяется в MDSplitLayout. Разрешение выдаёт Pane.
 */
export const defineAllowedBottomNavigation = (allowed: Ref<boolean>) => {
  const state = inject(KEY);
  if (!state) {
    throw new Error('Split layout is not provided');
  }

  const { numberOfBottomNavigationBans } = state;

  watch(
    allowed,
    (isAllowed) => {
      if (isAllowed) {
        numberOfBottomNavigationBans.value = Math.max(numberOfBottomNavigationBans.value - 1, 0);
      } else {
        numberOfBottomNavigationBans.value += 1;
      }
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    if (!allowed.value) {
      numberOfBottomNavigationBans.value -= 1;
    }
  });
};

/**
 * Разрешение использовать элементы управления в нижней части экрана.
 *
 * @description Разрешение определяется в Pane.
 */
export const useAllowBottomControls = () => {
  const state = {
    numberOfBottomNavigationBans: shallowRef(0),
  };

  provide(KEY, state);

  return {
    allowed: computed(() => state.numberOfBottomNavigationBans.value > 0),
  };
};
