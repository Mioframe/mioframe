import type { InjectionKey } from 'vue';
import { inject, provide } from 'vue';
import type { CreateMioframeSpaceContext } from './useCreateMioframeSpace';

const createMioframeSpaceContextKey: InjectionKey<CreateMioframeSpaceContext> = Symbol(
  'createMioframeSpaceContext',
);

export const provideCreateMioframeSpaceContext = (context: CreateMioframeSpaceContext) => {
  provide(createMioframeSpaceContextKey, context);
};

export const useCreateMioframeSpaceContext = () => {
  const context = inject(createMioframeSpaceContextKey);

  if (!context) {
    throw new Error('Create Mioframe space context is not provided');
  }

  return context;
};
