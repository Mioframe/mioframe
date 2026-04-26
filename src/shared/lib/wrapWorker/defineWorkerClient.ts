import { createGlobalState } from '@vueuse/core';
import type { ClientObject } from '../proxyService';
import { createClient } from '../proxyService';
import { transformers } from './workerTransformerMap';
import type { DomainError } from '../error';

export const defineWorkerClient = <T extends Record<string, unknown>>(
  worker: Worker | (() => Worker),
  serviceId: string,
  _setup: () => T,
) =>
  createGlobalState((): ClientObject<T, DomainError | FileSystemHandle> => {
    const resolvedWorker = typeof worker === 'function' ? worker() : worker;

    return createClient<T, DomainError | FileSystemHandle>(resolvedWorker, serviceId, transformers);
  });
