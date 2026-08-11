import type { M3eSwitchElement } from '@m3e/web/switch';
import type { HTMLAttributes, PublicProps } from 'vue';

type RendererSwitchProps = Pick<M3eSwitchElement, 'checked' | 'disabled'>;

type M3eSwitchProps = HTMLAttributes &
  PublicProps & {
    [Property in keyof RendererSwitchProps]?: RendererSwitchProps[Property] | undefined;
  } & {
    onChange?: (event: Event) => void;
  };

type M3eSwitchVueElement = new () => M3eSwitchElement & {
  /** Template-only property surface for the private renderer integration. */
  $props: M3eSwitchProps;
};

declare module 'vue' {
  interface GlobalComponents {
    'm3e-switch': M3eSwitchVueElement;
  }
}

export {};
