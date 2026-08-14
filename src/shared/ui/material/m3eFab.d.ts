import type { M3eFabElement } from '@m3e/web/fab';
import type { HTMLAttributes, PublicProps } from 'vue';

type RendererFabProps = Pick<M3eFabElement, 'variant' | 'size'>;

type M3eFabProps = HTMLAttributes &
  PublicProps & {
    [Property in keyof RendererFabProps]?: RendererFabProps[Property] | undefined;
  } & {
    onClick?: (event: MouseEvent) => void;
  };

type M3eFabVueElement = new () => M3eFabElement & {
  /** Template-only property surface for the private renderer integration. */
  $props: M3eFabProps;
};

declare module 'vue' {
  interface GlobalComponents {
    'm3e-fab': M3eFabVueElement;
  }
}

export {};
