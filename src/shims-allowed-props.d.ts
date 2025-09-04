import type { AriaAttributes } from 'vue';

declare module 'vue' {
  interface AllowedComponentProps extends AriaAttributes, Partial<ARIAMixin> {
    tabindex?: number | string;
  }
}

export {};
