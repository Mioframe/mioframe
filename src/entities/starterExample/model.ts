export type StarterExampleId = 'weeklyPlan' | 'shopping';

export type StarterExampleDefinition = {
  id: StarterExampleId;
  title: string;
  description: string;
  buttonLabel: string;
  iconName: string;
  buttonColor: 'filled' | 'tonal';
};

export const starterExampleDefinitions: readonly StarterExampleDefinition[] = [
  {
    id: 'weeklyPlan',
    title: 'Weekly planning',
    description:
      'Create a local weekly planning example with statuses and realistic tasks you can keep editing.',
    buttonLabel: 'Create Weekly Plan Example',
    iconName: 'calendar_view_week',
    buttonColor: 'tonal',
  },
  {
    id: 'shopping',
    title: 'Shopping example',
    description:
      'Create a local shopping example with purchase types and grouped views you can keep editing.',
    buttonLabel: 'Create Shopping Example',
    iconName: 'shopping_cart',
    buttonColor: 'tonal',
  },
] as const;
