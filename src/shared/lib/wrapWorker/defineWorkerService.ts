/// <reference lib="webworker" />

import type { UnknownRecord } from 'type-fest';
import { createService } from '../proxyService';
import { transformers } from './workerTransformerMap';

declare const self: DedicatedWorkerGlobalScope;

export const defineWorkerService = (serviceId: string, setup: () => UnknownRecord) => {
  createService(self, serviceId, transformers, setup);
};
