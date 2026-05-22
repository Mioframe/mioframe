import type { AllowedComponentProps, ComponentCustomProps, VNodeProps } from 'vue';

export type MDChipType = 'assist' | 'filter' | 'input' | 'suggestion';

export type MDChipBaseProps = {
  elevated?: boolean | undefined;
  label: string;
  draggable?: boolean | undefined;
  autofocus?: boolean | undefined;
  disabled?: boolean | undefined;
};

export type MDChipPropsByType = {
  assist: MDChipBaseProps & {
    type: 'assist';
    selected?: never;
    closeTooltip?: never;
  };
  filter: MDChipBaseProps & {
    type: 'filter';
    selected?: boolean | undefined;
    closeTooltip?: never;
  };
  input: MDChipBaseProps & {
    type: 'input';
    selected?: never;
    closeTooltip?: string | undefined;
  };
  suggestion: MDChipBaseProps & {
    type: 'suggestion';
    selected?: never;
    closeTooltip?: never;
  };
};

export type MDChipProps<T extends MDChipType> = MDChipBaseProps & {
  type: T;
  selected?: T extends 'filter' ? boolean | undefined : never;
  closeTooltip?: T extends 'input' ? string | undefined : never;
};

export type MDChipSlotsByType = {
  assist: {
    leadingIcon?: () => unknown;
    trailingIcon?: never;
  };
  filter: {
    leadingIcon?: never;
    trailingIcon?: () => unknown;
  };
  input: {
    leadingIcon?: never;
    trailingIcon?: never;
  };
  suggestion: {
    leadingIcon?: never;
    trailingIcon?: never;
  };
};

export type MDChipSlots<T extends MDChipType> = {
  leadingIcon?: T extends 'assist' ? () => unknown : never;
  trailingIcon?: T extends 'filter' ? () => unknown : never;
};

export type MDChipEmits = {
  (event: 'click' | 'clickClose', eventObject: MouseEvent): void;
};

export type MDChipPublicProps<T extends MDChipType> = MDChipProps<T> &
  VNodeProps &
  AllowedComponentProps &
  ComponentCustomProps & {
    onClick?: ((eventObject: MouseEvent) => unknown) | undefined;
    onClickClose?: ((eventObject: MouseEvent) => unknown) | undefined;
  };

export type MDChipComponent<T extends MDChipType = MDChipType> = (
  props: MDChipPublicProps<T>,
  ctx?: {
    slots: MDChipSlots<T>;
    attrs: Record<string, unknown>;
    emit: MDChipEmits;
  },
) => unknown;
