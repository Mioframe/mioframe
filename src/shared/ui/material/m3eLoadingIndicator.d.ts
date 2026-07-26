import type { HTMLAttributes, PublicProps } from 'vue';

type M3eLoadingIndicatorProps = HTMLAttributes & PublicProps;

type M3eLoadingIndicatorVueElement = new () => HTMLElement & {
  /** Template-only property surface for the private renderer integration. */
  $props: M3eLoadingIndicatorProps;
};

declare module 'vue' {
  interface GlobalComponents {
    'm3e-loading-indicator': M3eLoadingIndicatorVueElement;
  }
}

export {};
