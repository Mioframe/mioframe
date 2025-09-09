import { transferHandlers } from 'comlink';
import { cloneDeep } from 'es-toolkit';
import type { Reactive, Ref } from 'vue';
import { isReactive, isRef, toValue } from 'vue';

export const vueTransferHandlerSet = () => {
  transferHandlers.set('VueRef', {
    canHandle: (v): v is Ref => isRef(v),
    serialize: (x) => [
      {
        value: cloneDeep(toValue(x)),
      },
      [],
    ],
    deserialize: (v) => v,
  });

  transferHandlers.set('VueReactive', {
    canHandle: (v): v is Reactive<unknown> => isReactive(v),
    serialize: (x) => [cloneDeep(toValue(x)), []],
    deserialize: (v) => v,
  });
};
