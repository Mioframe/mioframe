import { defineRemoteWorker } from '@shared/lib/wrapWorker/defineRemoteWorker';
import Worker from './apiWorker?worker';
import type { API } from './apiWorker';

export const useApiWorker = defineRemoteWorker<API>(new Worker());
