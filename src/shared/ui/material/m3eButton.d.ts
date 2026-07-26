import type { HTMLAttributes, PublicProps } from 'vue';

type M3eButtonProps = HTMLAttributes &
  PublicProps & {
    disabled?: boolean;
    selected?: boolean;
    shape?: 'rounded' | 'square';
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    toggle?: boolean;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text';
    onBeforeinput?: (event: InputEvent) => void;
    onClick?: (event: MouseEvent) => void;
  };

type M3eButtonVueElement = new () => HTMLElement & {
  /** Template-only property surface for the private renderer integration. */
  $props: M3eButtonProps;
};

declare module 'vue' {
  interface GlobalComponents {
    'm3e-button': M3eButtonVueElement;
  }
}

export {};
