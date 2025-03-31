import type { App, Directive } from 'vue';
import { createApp, shallowReactive } from 'vue';
import TooltipContainer from './TooltipContainer.vue';
import { createGlobalState } from '@vueuse/core';
import { setupRootElement } from '@shared/lib/useRootElement';

let tooltipApp: App<Element> | undefined;

export const initTooltipApp = () => {
  if (tooltipApp) {
    return;
  }
  tooltipApp = createApp(TooltipContainer);
  const tooltipRootContainer = document.createElement('div');
  document.body.appendChild(tooltipRootContainer);
  setupRootElement(tooltipApp, tooltipRootContainer);
  tooltipApp.mount(tooltipRootContainer);
};

export const useTooltip = createGlobalState(() => {
  const registeredTooltip = new WeakMap<HTMLElement, string>();

  const showTooltipTimeout = new WeakMap<
    HTMLElement,
    ReturnType<typeof setTimeout>
  >();

  const showTooltip = (el: HTMLElement) => {
    const text = registeredTooltip.get(el);
    if (text) {
      showerTooltips.clear();
      showerTooltips.set(el, text);
    }
  };

  const hideTooltip = (el: HTMLElement) => {
    showerTooltips.delete(el);
  };

  const onMouseEnter = ({ target }: MouseEvent) => {
    if (target instanceof HTMLElement) {
      clearTimeout(showTooltipTimeout.get(target));
      clearTimeout(hideTooltipTimeout.get(target));
      showTooltipTimeout.set(
        target,
        setTimeout(() => {
          showTooltip(target);
        }, 300),
      );
    }
  };

  const hideTooltipTimeout = new WeakMap<
    HTMLElement,
    ReturnType<typeof setTimeout>
  >();

  const onMouseLeave = ({ target }: MouseEvent) => {
    if (target instanceof HTMLElement) {
      clearTimeout(showTooltipTimeout.get(target));
      clearTimeout(hideTooltipTimeout.get(target));
      hideTooltipTimeout.set(
        target,
        setTimeout(() => {
          hideTooltip(target);
        }, 1.5e3),
      );
    }
  };

  const onMountedTarget = (el: HTMLElement, text: string) => {
    registeredTooltip.set(el, text);
    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);
  };

  const onUnmountTarget = (el: HTMLElement) => {
    showerTooltips.delete(el);
    registeredTooltip.delete(el);
    el.removeEventListener('mouseenter', onMouseEnter);
    el.removeEventListener('mouseleave', onMouseLeave);
  };

  const showerTooltips = shallowReactive<Map<HTMLElement, string>>(new Map());

  return {
    showerTooltips,
    onMountedTarget,
    onUnmountTarget,
  };
});

export const vMdTooltip: Directive<HTMLElement, string> = {
  mounted(el, { value }) {
    const { onMountedTarget } = useTooltip();
    onMountedTarget(el, value);
  },
  beforeUnmount(el) {
    const { onUnmountTarget } = useTooltip();
    onUnmountTarget(el);
  },
};
