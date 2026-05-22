import type { MDChipPropsByType, MDChipSlotsByType } from './mdChipTypes';

type AssistProps = MDChipPropsByType['assist'];
type FilterProps = MDChipPropsByType['filter'];
type InputProps = MDChipPropsByType['input'];
type SuggestionProps = MDChipPropsByType['suggestion'];

type AssistSlots = MDChipSlotsByType['assist'];
type FilterSlots = MDChipSlotsByType['filter'];
type InputSlots = MDChipSlotsByType['input'];

const assistProps: AssistProps = {
  label: 'Assist',
  type: 'assist',
};

const filterProps: FilterProps = {
  label: 'Filter',
  type: 'filter',
  selected: true,
};

const inputProps: InputProps = {
  label: 'Input',
  type: 'input',
  closeTooltip: 'Remove chip',
};

const suggestionProps: SuggestionProps = {
  label: 'Suggestion',
  type: 'suggestion',
};

const assistSlots: AssistSlots = {
  leadingIcon: () => null,
};

const filterSlots: FilterSlots = {
  trailingIcon: () => null,
};

const inputSlots: InputSlots = {};

void assistProps;
void filterProps;
void inputProps;
void suggestionProps;
void assistSlots;
void filterSlots;
void inputSlots;

// @ts-expect-error selected is only valid for filter chips
const _invalidAssistSelected: AssistProps = { label: 'Assist', type: 'assist', selected: true };

const _invalidFilterCloseTooltip: FilterProps = {
  label: 'Filter',
  type: 'filter',
  // @ts-expect-error closeTooltip is only valid for input chips
  closeTooltip: 'Remove filter',
};

// @ts-expect-error assist chips do not accept trailingIcon
const _invalidAssistSlots: AssistSlots = { trailingIcon: () => null };

// @ts-expect-error filter chips do not accept leadingIcon
const _invalidFilterSlots: FilterSlots = { leadingIcon: () => null };

void _invalidAssistSelected;
void _invalidFilterCloseTooltip;
void _invalidAssistSlots;
void _invalidFilterSlots;
