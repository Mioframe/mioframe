import { setupMainService, serviceId } from './setupService';
import { defineWorkerService } from '@shared/lib/wrapWorker/defineWorkerService';

defineWorkerService(serviceId, setupMainService);
