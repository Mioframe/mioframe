import type { ComponentProps, ComponentSlots } from 'vue-component-type-helpers';
import type { MDChipComponent } from './mdChipTypes';

type AssistChip = MDChipComponent<'assist'>;
type FilterChip = MDChipComponent<'filter'>;
type InputChip = MDChipComponent<'input'>;
type SuggestionChip = MDChipComponent<'suggestion'>;

type AssistProps = ComponentProps<AssistChip>;
type FilterProps = ComponentProps<FilterChip>;
type InputProps = ComponentProps<InputChip>;
type SuggestionProps = ComponentProps<SuggestionChip>;

type AssistSlots = ComponentSlots<AssistChip>;
type FilterSlots = ComponentSlots<FilterChip>;
type InputSlots = ComponentSlots<InputChip>;
type SuggestionSlots = ComponentSlots<SuggestionChip>;

type ExpectTrue<T extends true> = T;
type ExpectFalse<T extends false> = T;
type IsAssignable<From, To> = [From] extends [To] ? true : false;

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
const suggestionSlots: SuggestionSlots = {};

const assistLeadingIconIsValid: ExpectTrue<IsAssignable<{ leadingIcon: () => null }, AssistSlots>> =
  true;
const filterSelectedIsValid: ExpectTrue<
  IsAssignable<{ label: 'Filter'; type: 'filter'; selected: true }, FilterProps>
> = true;
const filterTrailingIconIsValid: ExpectTrue<
  IsAssignable<{ trailingIcon: () => null }, FilterSlots>
> = true;
const inputCloseTooltipIsValid: ExpectTrue<
  IsAssignable<{ label: 'Input'; type: 'input'; closeTooltip: 'Remove chip' }, InputProps>
> = true;
const suggestionStaysNarrow: ExpectTrue<
  IsAssignable<{ label: 'Suggestion'; type: 'suggestion' }, SuggestionProps>
> = true;

const assistRejectsSelected: ExpectFalse<
  IsAssignable<{ label: 'Assist'; type: 'assist'; selected: true }, AssistProps>
> = false;
const inputRejectsSelected: ExpectFalse<
  IsAssignable<{ label: 'Input'; type: 'input'; selected: true }, InputProps>
> = false;
const suggestionRejectsSelected: ExpectFalse<
  IsAssignable<{ label: 'Suggestion'; type: 'suggestion'; selected: true }, SuggestionProps>
> = false;

const assistRejectsCloseTooltip: ExpectFalse<
  IsAssignable<{ label: 'Assist'; type: 'assist'; closeTooltip: 'Remove assist' }, AssistProps>
> = false;
const filterRejectsCloseTooltip: ExpectFalse<
  IsAssignable<{ label: 'Filter'; type: 'filter'; closeTooltip: 'Remove filter' }, FilterProps>
> = false;
const suggestionRejectsCloseTooltip: ExpectFalse<
  IsAssignable<
    { label: 'Suggestion'; type: 'suggestion'; closeTooltip: 'Remove suggestion' },
    SuggestionProps
  >
> = false;

const filterRejectsLeadingIcon: ExpectFalse<
  IsAssignable<{ leadingIcon: () => null }, FilterSlots>
> = false;
const inputRejectsLeadingIcon: ExpectFalse<IsAssignable<{ leadingIcon: () => null }, InputSlots>> =
  false;
const suggestionRejectsLeadingIcon: ExpectFalse<
  IsAssignable<{ leadingIcon: () => null }, SuggestionSlots>
> = false;

const assistRejectsTrailingIcon: ExpectFalse<
  IsAssignable<{ trailingIcon: () => null }, AssistSlots>
> = false;
const inputRejectsTrailingIcon: ExpectFalse<
  IsAssignable<{ trailingIcon: () => null }, InputSlots>
> = false;
const suggestionRejectsTrailingIcon: ExpectFalse<
  IsAssignable<{ trailingIcon: () => null }, SuggestionSlots>
> = false;

void assistProps;
void filterProps;
void inputProps;
void suggestionProps;
void assistSlots;
void filterSlots;
void inputSlots;
void suggestionSlots;
void assistLeadingIconIsValid;
void filterSelectedIsValid;
void filterTrailingIconIsValid;
void inputCloseTooltipIsValid;
void suggestionStaysNarrow;
void assistRejectsSelected;
void inputRejectsSelected;
void suggestionRejectsSelected;
void assistRejectsCloseTooltip;
void filterRejectsCloseTooltip;
void suggestionRejectsCloseTooltip;
void filterRejectsLeadingIcon;
void inputRejectsLeadingIcon;
void suggestionRejectsLeadingIcon;
void assistRejectsTrailingIcon;
void inputRejectsTrailingIcon;
void suggestionRejectsTrailingIcon;
