import { Repo } from '@automerge/automerge-repo';
import { nextTick, ref } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import {
  markDatabaseExampleDocumentCreateSuccess,
  resetDatabaseExampleDocumentCreateSuccessForTest,
  useDatabaseExampleDocumentCreateSuccess,
} from './useDatabaseExampleDocumentCreateSuccess';

const DIR = '/Device Files/Browser Storage/Examples';
const OTHER_DIR = '/Device Files/Browser Storage/Examples 2';

const createDocumentId = () => new Repo().create({}).documentId;

describe('useDatabaseExampleDocumentCreateSuccess', () => {
  afterEach(() => {
    resetDatabaseExampleDocumentCreateSuccessForTest();
  });

  it('is not visible when no mark has been set', () => {
    const docId = createDocumentId();
    const { isVisible } = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    expect(isVisible.value).toBe(false);
  });

  it('is visible on first use when marked', () => {
    const docId = createDocumentId();
    markDatabaseExampleDocumentCreateSuccess(DIR, docId);
    const { isVisible } = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    expect(isVisible.value).toBe(true);
  });

  it('is not visible on second use after the first use consumed the marker', () => {
    const docId = createDocumentId();
    markDatabaseExampleDocumentCreateSuccess(DIR, docId);
    useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    const { isVisible } = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    expect(isVisible.value).toBe(false);
  });

  it('does not show on remount when first use was not dismissed', () => {
    const docId = createDocumentId();
    markDatabaseExampleDocumentCreateSuccess(DIR, docId);
    const first = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    expect(first.isVisible.value).toBe(true);
    const { isVisible } = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    expect(isVisible.value).toBe(false);
  });

  it('dismiss hides the currently visible card', () => {
    const docId = createDocumentId();
    markDatabaseExampleDocumentCreateSuccess(DIR, docId);
    const { isVisible, dismiss } = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    expect(isVisible.value).toBe(true);
    dismiss();
    expect(isVisible.value).toBe(false);
  });

  it('does not show for a different documentId', () => {
    const docId = createDocumentId();
    const otherDocId = createDocumentId();
    markDatabaseExampleDocumentCreateSuccess(DIR, docId);
    const { isVisible } = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(otherDocId));
    expect(isVisible.value).toBe(false);
    useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
  });

  it('does not show for a different documentDirectory', () => {
    const docId = createDocumentId();
    markDatabaseExampleDocumentCreateSuccess(DIR, docId);
    const { isVisible } = useDatabaseExampleDocumentCreateSuccess(ref(OTHER_DIR), ref(docId));
    expect(isVisible.value).toBe(false);
    useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
  });

  it('remains hidden without a mark — simulates normal document open or reload', () => {
    const docId = createDocumentId();
    const { isVisible } = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    expect(isVisible.value).toBe(false);
  });

  describe('reactive identity changes', () => {
    it('shows card when refs change from unmatched doc A to marked doc B', async () => {
      const docA = createDocumentId();
      const docB = createDocumentId();
      markDatabaseExampleDocumentCreateSuccess(DIR, docB);

      const dirRef = ref(DIR);
      const idRef = ref(docA);
      const { isVisible } = useDatabaseExampleDocumentCreateSuccess(dirRef, idRef);
      expect(isVisible.value).toBe(false);

      idRef.value = docB;
      await nextTick();

      expect(isVisible.value).toBe(true);
    });

    it('hides card when refs change away from consumed doc B to doc C', async () => {
      const docB = createDocumentId();
      const docC = createDocumentId();
      markDatabaseExampleDocumentCreateSuccess(DIR, docB);

      const dirRef = ref(DIR);
      const idRef = ref(docB);
      const { isVisible } = useDatabaseExampleDocumentCreateSuccess(dirRef, idRef);
      expect(isVisible.value).toBe(true);

      idRef.value = docC;
      await nextTick();

      expect(isVisible.value).toBe(false);
    });

    it('remains hidden when refs change back to already-consumed doc B', async () => {
      const docB = createDocumentId();
      const docC = createDocumentId();
      markDatabaseExampleDocumentCreateSuccess(DIR, docB);

      const dirRef = ref(DIR);
      const idRef = ref(docB);
      const { isVisible } = useDatabaseExampleDocumentCreateSuccess(dirRef, idRef);
      expect(isVisible.value).toBe(true);

      idRef.value = docC;
      await nextTick();
      expect(isVisible.value).toBe(false);

      idRef.value = docB;
      await nextTick();

      expect(isVisible.value).toBe(false);
    });

    it('second composable for already-consumed doc B does not show the card', async () => {
      const docA = createDocumentId();
      const docB = createDocumentId();
      markDatabaseExampleDocumentCreateSuccess(DIR, docB);

      const dirRef = ref(DIR);
      const idRef = ref(docA);
      const first = useDatabaseExampleDocumentCreateSuccess(dirRef, idRef);
      expect(first.isVisible.value).toBe(false);

      idRef.value = docB;
      await nextTick();
      expect(first.isVisible.value).toBe(true);

      const { isVisible: secondVisible } = useDatabaseExampleDocumentCreateSuccess(
        ref(DIR),
        ref(docB),
      );
      expect(secondVisible.value).toBe(false);
    });
  });
});
