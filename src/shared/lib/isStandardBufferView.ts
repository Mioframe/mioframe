/**
 * Type Guard: Проверяет, является ли значение типизированным массивом (View),
 * основанным на стандартном `ArrayBuffer`.
 * * Исключает `SharedArrayBuffer`, который несовместим с большинством Web API (VFS, Blob, etc),
 * и позволяет TypeScript корректно сузить тип до `ArrayBufferView<ArrayBuffer>`.
 * * @param value - Любое значение для проверки.
 */
export const isStandardBufferView = (
  value: unknown,
): value is ArrayBufferView<ArrayBuffer> =>
  ArrayBuffer.isView(value) && value.buffer instanceof ArrayBuffer;
