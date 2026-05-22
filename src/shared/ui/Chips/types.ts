/**
 * Common props for Material Design chip component
 */
export type MDChipCommonProps = {
  /** Whether the chip should have an elevated appearance */
  elevated?: boolean | undefined;
  /** The label text displayed on the chip */
  label: string;
  /** Whether the chip is draggable */
  draggable?: boolean | undefined;
  /** Whether the chip should autofocus */
  autofocus?: boolean | undefined;
  /** Whether the chip is disabled */
  disabled?: boolean | undefined;
};
