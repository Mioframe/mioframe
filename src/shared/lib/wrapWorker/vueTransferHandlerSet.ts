import { transferHandlers } from 'comlink';
import { cloneDeepWith, isFunction } from 'es-toolkit';
import type { Reactive, Ref } from 'vue';
import { isReactive, isRef, toRaw, toValue } from 'vue';

const cloneValueSerialize = (v: unknown, k?: PropertyKey): unknown => {
  if (isFunction(v)) {
    return 'fucking function';
  }
  if (isRef(v)) {
    return cloneDeepWith(toValue(v) ?? null, cloneValueSerialize);
  }
  if (isReactive(v)) {
    return cloneDeepWith(toRaw(v) ?? null, cloneValueSerialize);
  }
};

export const cloneDeepSerialize = <T>(v: T): T =>
  cloneDeepWith(v, cloneValueSerialize);

export const vueTransferHandlerSet = () => {
  transferHandlers.set('VueRef', {
    canHandle: (v): v is Ref => isRef(v),
    serialize: (x: Ref) => {
      const v = cloneDeepWith(x, cloneValueSerialize);

      return [v, []];
    },
    deserialize: (v) => v,
  });

  transferHandlers.set('VueReactive', {
    canHandle: (v): v is Reactive<unknown> => {
      return isReactive(v);
    },
    serialize: (x: Reactive<unknown>) => {
      const v = cloneDeepWith(x, cloneValueSerialize);

      return [v, []];
    },
    deserialize: (v) => v,
  });
};
