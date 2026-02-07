import { definePane } from '@page/SplitView/definePane';
import { zodQuery } from './model';
import DocumentViewPane from './DocumentViewPane.vue';

export const documentViewPane = definePane(DocumentViewPane, zodQuery);
