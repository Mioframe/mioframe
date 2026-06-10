import { Repo } from '@automerge/automerge-repo';
import { ref } from 'vue';
import { describe, expect, it } from 'vitest';
import {
  markDatabaseExampleDocumentCreateSuccess,
  useDatabaseExampleDocumentCreateSuccess,
} from './useDatabaseExampleDocumentCreateSuccess';

const DIR = '/Device Files/Browser Storage/Examples';
const OTHER_DIR = '/Device Files/Browser Storage/Examples 2';

const createDocumentId = () => new Repo().create({}).documentId;

describe('useDatabaseExampleDocumentCreateSuccess', () => {
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
});
