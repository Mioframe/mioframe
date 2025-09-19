import { defineRemoteWorker } from '@shared/lib/wrapWorker/defineRemoteWorker';
import Worker from './apiService?worker';
import type { API } from './apiService';

export const useApiClient = defineRemoteWorker<API>(new Worker());
