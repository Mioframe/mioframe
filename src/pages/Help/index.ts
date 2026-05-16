import { definePane } from '@page/SplitView/definePane';
import HelpArticlePane from './HelpArticlePane.vue';
import HelpIndexPane from './HelpIndexPane.vue';
import { zodQuery } from './model';

export const helpIndexPane = definePane({ component: HelpIndexPane });

export const helpArticlePane = definePane({
  component: HelpArticlePane,
  zodQuery,
});
