import { setupMainService, serviceId } from './setupMainService';
import { defineWorkerService } from '@shared/lib/wrapWorker/defineWorkerService';

defineWorkerService(serviceId, setupMainService);
