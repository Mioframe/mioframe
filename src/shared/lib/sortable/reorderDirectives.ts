import type { Directive, VNode } from 'vue';
import { REORDER_IGNORE_ATTRIBUTE, REORDER_ITEM_ATTRIBUTE } from './constants';

/** Warns in development when a directive relies on a component root element contract. */
const warnDirectiveRootCoupling = (
  directiveName: string,
  vnode: VNode,
  element: unknown,
) => {
  if (import.meta.env.PROD || typeof vnode.type === 'string') {
    return;
  }

  const componentName =
    typeof vnode.type === 'object' && 'name' in vnode.type
      ? (vnode.type.name ?? 'AnonymousComponent')
      : 'AnonymousComponent';

  if (!(element instanceof HTMLElement)) {
    // eslint-disable-next-line no-console -- dev-only warning for invalid directive host
    console.warn(
      `[sortable] ${directiveName} requires an HTMLElement root; ` +
        `${componentName} does not expose one.`,
    );
    return;
  }

  // eslint-disable-next-line no-console -- dev-only warning about component root coupling
  console.warn(
    `[sortable] ${directiveName} is used on ${componentName}. ` +
      'This relies on the component keeping a single HTMLElement root.',
  );
};

/** Narrows an arbitrary directive host to `HTMLElement` with a dev warning on mismatch. */
const asHtmlElement = (
  directiveName: string,
  element: unknown,
): HTMLElement | undefined => {
  if (element instanceof HTMLElement) {
    return element;
  }

  if (!import.meta.env.PROD) {
    // eslint-disable-next-line no-console -- dev-only warning for invalid directive host
    console.warn(
      `[sortable] ${directiveName} can only be used on elements with an HTMLElement root.`,
    );
  }

  return undefined;
};

/** Updates a DOM attribute while preserving the "attribute absent" case. */
const setOrRemoveAttribute = (
  element: HTMLElement,
  attributeName: string,
  attributeValue: string | undefined,
) => {
  if (attributeValue === undefined) {
    element.removeAttribute(attributeName);
    return;
  }

  element.setAttribute(attributeName, attributeValue);
};

/** Marks a host element as a reorderable item and writes its stable item id. */
export const vReorderItem: Directive<HTMLElement, string | undefined> = {
  mounted: (element, binding, vnode) => {
    warnDirectiveRootCoupling('v-reorder-item', vnode, element);

    const htmlElement = asHtmlElement('v-reorder-item', element);

    if (!htmlElement) {
      return;
    }

    setOrRemoveAttribute(
      htmlElement,
      REORDER_ITEM_ATTRIBUTE,
      binding.value || undefined,
    );
  },
  updated: (element, binding) => {
    const htmlElement = asHtmlElement('v-reorder-item', element);

    if (!htmlElement) {
      return;
    }

    setOrRemoveAttribute(
      htmlElement,
      REORDER_ITEM_ATTRIBUTE,
      binding.value || undefined,
    );
  },
  beforeUnmount: (element) => {
    const htmlElement = asHtmlElement('v-reorder-item', element);

    htmlElement?.removeAttribute(REORDER_ITEM_ATTRIBUTE);
  },
};

/** Marks a host element as ignored by drag activation and filtering logic. */
export const vReorderIgnore: Directive<HTMLElement, boolean | undefined> = {
  mounted: (element, binding, vnode) => {
    warnDirectiveRootCoupling('v-reorder-ignore', vnode, element);

    const htmlElement = asHtmlElement('v-reorder-ignore', element);

    if (!htmlElement) {
      return;
    }

    setOrRemoveAttribute(
      htmlElement,
      REORDER_IGNORE_ATTRIBUTE,
      binding.value === false ? undefined : '',
    );
  },
  updated: (element, binding) => {
    const htmlElement = asHtmlElement('v-reorder-ignore', element);

    if (!htmlElement) {
      return;
    }

    setOrRemoveAttribute(
      htmlElement,
      REORDER_IGNORE_ATTRIBUTE,
      binding.value === false ? undefined : '',
    );
  },
  beforeUnmount: (element) => {
    const htmlElement = asHtmlElement('v-reorder-ignore', element);

    htmlElement?.removeAttribute(REORDER_IGNORE_ATTRIBUTE);
  },
};
