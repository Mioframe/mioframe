import type { M3eCheckboxElement } from '@m3e/web/checkbox';
import type { HTMLAttributes, PublicProps } from 'vue';

type RendererCheckboxProps = Pick<M3eCheckboxElement, 'checked' | 'indeterminate' | 'disabled'>;

type M3eCheckboxProps = HTMLAttributes &
  PublicProps & {
    [Property in keyof RendererCheckboxProps]?: RendererCheckboxProps[Property] | undefined;
  } & {
    // The installed `@m3e/web@2.6.3` renderer dispatches `beforeinput` as a plain `Event`
    // (`new Event('beforeinput', { bubbles: true, cancelable: true })`), not the ambient DOM
    // lib's `InputEvent`; see ARCHITECTURE.md "Renderer mapping and gaps" private typing seam.
    onBeforeinput?: (event: Event) => void;
  };

type M3eCheckboxVueElement = new () => M3eCheckboxElement & {
  /** Template-only property surface for the private renderer integration. */
  $props: M3eCheckboxProps;
};

declare module 'vue' {
  interface GlobalComponents {
    'm3e-checkbox': M3eCheckboxVueElement;
  }
}

export {};
