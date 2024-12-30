import type { App, Directive } from 'vue';
import { createApp, reactive, ref } from 'vue';
import TooltipContainer from './TooltipContainer.vue';
import type { Pinia } from 'pinia';
import { createPinia, defineStore } from 'pinia';

let pinia: Pinia | undefined = undefined;
let tooltipApp: App<Element> | undefined;

export const initTooltipApp = () => {
  if (tooltipApp) {
    return;
  }
  tooltipApp = createApp(TooltipContainer);
  const tooltipRootContainer = document.createElement('div');
  document.body.appendChild(tooltipRootContainer);
  if (!pinia) {
    pinia = createPinia();
  }
  tooltipApp.use(pinia);
  tooltipApp.mount(tooltipRootContainer);
};

export const useTooltip = defineStore('tooltip', () => {
  const tooltipCollection = reactive<Map<HTMLElement, string>>(new Map());

  const tooltipState = ref<{
    text: string | undefined;
    targetElement: HTMLElement | undefined;
  }>({ text: undefined, targetElement: undefined });

  const setTooltip = (text: string, el: HTMLElement) => {
    tooltipState.value.text = text;
    tooltipState.value.targetElement = el;
  };

  const clearTooltip = () => {
    tooltipState.value.targetElement = undefined;
    tooltipState.value.text = undefined;
  };

  let showTooltipTimeout: ReturnType<typeof setTimeout> | undefined;

  const showTooltip = (el: HTMLElement) => {
    const text = tooltipCollection.get(el);
    if (text) {
      setTooltip(text, el);
    }
  };

  const hideTooltip = () => {
    clearTooltip();
  };

  const onMouseEnter = ({ target }: MouseEvent) => {
    if (target instanceof HTMLElement) {
      clearTimeout(showTooltipTimeout);
      clearTimeout(hideTooltipTimeout);
      showTooltipTimeout = setTimeout(() => {
        showTooltip(target);
      }, 300);
    }
  };

  let hideTooltipTimeout: ReturnType<typeof setTimeout> | undefined;

  const onMouseLeave = () => {
    clearTimeout(showTooltipTimeout);
    clearTimeout(hideTooltipTimeout);
    hideTooltipTimeout = setTimeout(() => {
      hideTooltip();
    }, 1.5e3);
  };

  const addTooltip = (el: HTMLElement, text: string) => {
    tooltipCollection.set(el, text);
    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);
  };

  const removeTooltip = (el: HTMLElement) => {
    tooltipCollection.delete(el);
    el.removeEventListener('mouseenter', onMouseEnter);
    el.removeEventListener('mouseleave', onMouseLeave);
  };

  return {
    tooltipState,
    addTooltip,
    removeTooltip,
  };
});

export const vMdTooltip: Directive<HTMLElement, string> = {
  created: () => {
    initTooltipApp();
  },
  mounted(el, { value }) {
    const { addTooltip } = useTooltip(pinia);
    addTooltip(el, value);
  },
  beforeUnmount(el) {
    const { removeTooltip } = useTooltip(pinia);
    removeTooltip(el);
  },
};
