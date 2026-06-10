import { Repo } from '@automerge/automerge-repo';
import { ref } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import {
  markDatabaseExampleDocumentCreateSuccess,
  useDatabaseExampleDocumentCreateSuccess,
} from './useDatabaseExampleDocumentCreateSuccess';

const DIR = '/Device Files/Browser Storage/Examples';
const OTHER_DIR = '/Device Files/Browser Storage/Examples 2';

const createDocumentId = () => new Repo().create({}).documentId;

afterEach(() => {
  // Module-level state is cleared between tests by dismissing any previously marked keys.
  // Tests that mark keys should dismiss them in afterEach or use separate IDs per test.
});

describe('useDatabaseExampleDocumentCreateSuccess', () => {
  it('is not visible when no mark has been set', () => {
    const docId = createDocumentId();
    const { isVisible } = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    expect(isVisible.value).toBe(false);
  });

  it('becomes visible after markDatabaseExampleDocumentCreateSuccess is called', () => {
    const docId = createDocumentId();
    markDatabaseExampleDocumentCreateSuccess(DIR, docId);

    const { isVisible, dismiss } = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    expect(isVisible.value).toBe(true);

    dismiss();
  });

  it('is hidden after dismiss is called', () => {
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

    const { isVisible, dismiss: d } = useDatabaseExampleDocumentCreateSuccess(
      ref(DIR),
      ref(otherDocId),
    );
    expect(isVisible.value).toBe(false);

    // Cleanup
    useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId)).dismiss();
    d();
  });

  it('does not show for a different documentDirectory', () => {
    const docId = createDocumentId();
    markDatabaseExampleDocumentCreateSuccess(DIR, docId);

    const { isVisible } = useDatabaseExampleDocumentCreateSuccess(ref(OTHER_DIR), ref(docId));
    expect(isVisible.value).toBe(false);

    // Cleanup
    useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId)).dismiss();
  });

  it('does not affect other document keys when dismissed', () => {
    const docId = createDocumentId();
    const otherDocId = createDocumentId();
    markDatabaseExampleDocumentCreateSuccess(DIR, docId);
    markDatabaseExampleDocumentCreateSuccess(OTHER_DIR, otherDocId);

    const target = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    const other = useDatabaseExampleDocumentCreateSuccess(ref(OTHER_DIR), ref(otherDocId));

    target.dismiss();

    expect(target.isVisible.value).toBe(false);
    expect(other.isVisible.value).toBe(true);

    other.dismiss();
  });

  it('remains hidden without a mark — simulates normal document open or reload', () => {
    const docId = createDocumentId();
    const { isVisible } = useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId));
    expect(isVisible.value).toBe(false);
  });

  it('reacts to documentId ref change', () => {
    const docId = createDocumentId();
    const otherDocId = createDocumentId();
    markDatabaseExampleDocumentCreateSuccess(DIR, docId);

    const dirRef = ref(DIR);
    const docRef = ref(docId);
    const { isVisible, dismiss } = useDatabaseExampleDocumentCreateSuccess(dirRef, docRef);

    expect(isVisible.value).toBe(true);

    docRef.value = otherDocId;
    expect(isVisible.value).toBe(false);

    dismiss();
    useDatabaseExampleDocumentCreateSuccess(ref(DIR), ref(docId)).dismiss();
  });
});
