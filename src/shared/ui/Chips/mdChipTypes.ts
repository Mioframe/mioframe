export type MDChipType = 'assist' | 'filter' | 'input' | 'suggestion';

type MDChipBaseProps = {
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

export type MDChipEmits = {
  (event: 'click' | 'clickClose', eventObject: MouseEvent): void;
};
