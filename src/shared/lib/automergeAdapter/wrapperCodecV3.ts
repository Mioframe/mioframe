import { zodIs } from '../validateZodScheme';
import type { ChangedType, ChunkStorageKey } from './types';
import { zodStorageKey } from './types';

const WRAPPER_MAGIC = new Uint8Array([0x4d, 0x49, 0x4f, 0x46, 0x52, 0x4d, 0x03]);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const KIND_TO_CODE: Readonly<Record<ChangedType, number>> = {
  snapshot: 1,
  incremental: 2,
};

const CODE_TO_KIND: Readonly<Record<number, ChangedType>> = {
  1: 'snapshot',
  2: 'incremental',
};

/**
 * Decoded Mioframe v3 wrapper payload.
 */
export interface DecodedV3StorageWrapper {
  /** Full logical Automerge storage key recovered from the wrapper. */
  key: ChunkStorageKey;
  /** Original raw Automerge chunk bytes. */
  data: Uint8Array;
}

/**
 * Wraps raw Automerge chunk bytes with Mioframe v3 storage metadata.
 * @param key - Full logical Automerge chunk key.
 * @param data - Raw non-wrapper Automerge bytes.
 * @returns Wrapped bytes ready to persist in a `.mf` file.
 */
export const encodeV3StorageWrapper = (
  key: ChunkStorageKey,
  data: Uint8Array,
): Uint8Array<ArrayBuffer> => {
  const [documentId, kind, hash] = key;
  const documentIdBytes = encoder.encode(documentId);
  const hashBytes = encoder.encode(hash);
  const wrapped = new Uint8Array(
    WRAPPER_MAGIC.length + 2 + documentIdBytes.length + 1 + 2 + hashBytes.length + 4 + data.length,
  );
  const view = new DataView(wrapped.buffer);

  wrapped.set(WRAPPER_MAGIC, 0);
  let offset = WRAPPER_MAGIC.length;

  view.setUint16(offset, documentIdBytes.length);
  offset += 2;
  wrapped.set(documentIdBytes, offset);
  offset += documentIdBytes.length;

  view.setUint8(offset, KIND_TO_CODE[kind]);
  offset += 1;

  view.setUint16(offset, hashBytes.length);
  offset += 2;
  wrapped.set(hashBytes, offset);
  offset += hashBytes.length;

  view.setUint32(offset, data.length);
  offset += 4;
  wrapped.set(data, offset);

  return wrapped;
};

/**
 * Decodes a Mioframe v3 storage wrapper back to its full logical key and raw Automerge bytes.
 * @param data - Wrapped `.mf` file bytes.
 * @returns Decoded logical key and raw payload, or undefined when the wrapper is invalid.
 */
export const decodeV3StorageWrapper = (data: Uint8Array): DecodedV3StorageWrapper | undefined => {
  if (data.length <= WRAPPER_MAGIC.length + 9) {
    return undefined;
  }

  for (let i = 0; i < WRAPPER_MAGIC.length; i++) {
    if (data[i] !== WRAPPER_MAGIC[i]) {
      return undefined;
    }
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = WRAPPER_MAGIC.length;

  if (offset + 2 > data.length) {
    return undefined;
  }

  const documentIdLength = view.getUint16(offset);
  offset += 2;
  if (documentIdLength <= 0 || offset + documentIdLength > data.length) {
    return undefined;
  }

  const documentId = decoder.decode(data.subarray(offset, offset + documentIdLength));
  offset += documentIdLength;

  if (offset + 1 > data.length) {
    return undefined;
  }

  const kind = CODE_TO_KIND[view.getUint8(offset)];
  offset += 1;
  if (!kind) {
    return undefined;
  }

  if (offset + 2 > data.length) {
    return undefined;
  }

  const hashLength = view.getUint16(offset);
  offset += 2;
  if (hashLength <= 0 || offset + hashLength > data.length) {
    return undefined;
  }

  const hash = decoder.decode(data.subarray(offset, offset + hashLength));
  offset += hashLength;

  if (offset + 4 > data.length) {
    return undefined;
  }

  const payloadLength = view.getUint32(offset);
  offset += 4;
  if (payloadLength <= 0 || offset + payloadLength !== data.length) {
    return undefined;
  }

  const payload = data.subarray(offset, offset + payloadLength);

  const key = [documentId, kind, hash];

  if (!zodIs(key, zodStorageKey) || key.length !== 3) {
    return undefined;
  }

  return {
    key,
    data: payload,
  };
};
