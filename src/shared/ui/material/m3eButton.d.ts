import type { M3eButtonElement } from '@m3e/web/button';
import type { HTMLAttributes, PublicProps } from 'vue';

type RendererButtonProps = Pick<
  M3eButtonElement,
  'disabled' | 'shape' | 'size' | 'toggle' | 'type' | 'variant'
>;

type M3eButtonProps = HTMLAttributes &
  PublicProps & {
    [Property in keyof RendererButtonProps]?: RendererButtonProps[Property] | undefined;
  } & {
    onBeforeinput?: (event: InputEvent) => void;
    onClick?: (event: MouseEvent) => void;
  };

type M3eButtonVueElement = new () => M3eButtonElement & {
  /** Template-only property surface for the private renderer integration. */
  $props: M3eButtonProps;
};

declare module 'vue' {
  interface GlobalComponents {
    'm3e-button': M3eButtonVueElement;
  }
}

export {};
