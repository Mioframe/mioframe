import { describe, expect, it, vi } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import { generatePropertyId } from '@shared/lib/databaseDocument';
import { effectScope, nextTick, ref } from 'vue';

const databasePropertyMock = vi.fn();
const patchMock = vi.fn();
const useObservableQueryMock = vi.fn();

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    databaseDocument: {
      properties: {
        patch: patchMock,
        databaseProperty: databasePropertyMock,
      },
    },
  }),
}));

vi.mock('@shared/lib/useObservableQuery', () => ({
  useObservableQuery: (...args: unknown[]) => useObservableQueryMock(...args),
}));

const stringProperty = { name: 'title', type: 'string' };

describe('useDatabaseProperty', () => {
  it('keeps the already-resolved property when the query re-emits a transient undefined', async () => {
    const data = ref<typeof stringProperty | undefined>(stringProperty);
    useObservableQueryMock.mockReturnValue({
      data,
      error: ref(undefined),
      isLoading: ref(false),
    });

    const { useDatabaseProperty } = await import('./useDatabaseProperty');
    const path = ref('/repo');
    const documentId = ref(new Repo().create({}).documentId);
    const propertyId = ref(generatePropertyId());
    const scope = effectScope();
    let state!: ReturnType<typeof useDatabaseProperty>;

    scope.run(() => {
      state = useDatabaseProperty(path, documentId, propertyId);
    });
    await nextTick();

    expect(state.property.value).toEqual(stringProperty);

    // Same property identity, upstream query re-emits a transient undefined.
    data.value = undefined;
    await nextTick();

    expect(state.property.value).toEqual(stringProperty);

    scope.stop();
  });

  it('clears the resolved property when the property id changes', async () => {
    const data = ref<typeof stringProperty | undefined>(stringProperty);
    useObservableQueryMock.mockReturnValue({
      data,
      error: ref(undefined),
      isLoading: ref(false),
    });

    const { useDatabaseProperty } = await import('./useDatabaseProperty');
    const path = ref('/repo');
    const documentId = ref(new Repo().create({}).documentId);
    const propertyId = ref(generatePropertyId());
    const scope = effectScope();
    let state!: ReturnType<typeof useDatabaseProperty>;

    scope.run(() => {
      state = useDatabaseProperty(path, documentId, propertyId);
    });
    await nextTick();

    expect(state.property.value).toEqual(stringProperty);

    propertyId.value = generatePropertyId();
    data.value = undefined;
    await nextTick();

    expect(state.property.value).toBeUndefined();

    scope.stop();
  });
});
