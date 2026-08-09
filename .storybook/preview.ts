import { setup } from '@storybook/vue3-vite';
import type { Decorator, Preview } from '@storybook/vue3-vite';
import 'material-symbols/rounded.css';
import '../src/app/styles/base.css';
import './visual.css';
import { installStorybookRouter } from './router/routerHarness';
import {
  applyStorybookColorScheme,
  STORYBOOK_COLOR_SCHEME_DEFAULT,
  STORYBOOK_COLOR_SCHEME_GLOBAL_KEY,
} from './theme/colorSchemeAdapter';

// Storybook creates a fresh Vue app per story (re)mount (see @storybook/vue3's
// renderToCanvas), and `setup()` callbacks run once per app creation — so installing the
// router harness here gives every story its own isolated router instance, with no route
// state leaking between stories.
setup(async (app, context) => {
  await installStorybookRouter(app, context?.parameters.router);
});

// Toggling the theme toolbar updates `globals` without necessarily remounting the app (an
// args/globals-only update reuses the existing app), so the color scheme is applied from a
// decorator instead of `setup()`: decorators re-run on every render, remount or not.
const withColorScheme: Decorator = (story, context) => {
  applyStorybookColorScheme(context.globals[STORYBOOK_COLOR_SCHEME_GLOBAL_KEY]);
  return story();
};

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        app: { name: 'App', value: 'var(--md-sys-color-background, #ffffff)' },
        surface: { name: 'Surface', value: 'var(--md-sys-color-surface, #ffffff)' },
      },
    },
    viewport: {
      options: {
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '900px' },
        },
        mobile: {
          name: 'Mobile',
          styles: { width: '393px', height: '852px' },
        },
      },
    },
    options: {
      // Storybook's story-index generator re-evaluates this function's own source text as
      // plain JavaScript, in isolation, to build the sidebar. So it must be a fully
      // self-contained literal (no closure over imports/module scope, and no TypeScript-only
      // syntax such as inline parameter type annotations, or that re-evaluation throws a
      // runtime SyntaxError) rather than calling out to a shared, separately unit-tested
      // helper; the `@ts-expect-error` comments below suppress the resulting implicit-`any`
      // diagnostics without adding any such syntax. Case-insensitive top-level matching lets
      // already lowercase-cased legacy titles (e.g. `shared/ui/MDCheckbox`) group under their
      // documented namespace without renaming any existing story title; an unmatched
      // top-level segment (e.g. the legacy `Project UI/...` namespace) sorts after every
      // documented namespace instead of being silently dropped.
      storySort: (
        // @ts-expect-error -- parameter intentionally untyped; see comment above.
        a,
        // @ts-expect-error -- parameter intentionally untyped; see comment above.
        b,
      ) => {
        const catalogueOrder = ['material 3', 'shared', 'entities', 'features', 'widgets', 'pages'];
        const getRank = (
          // @ts-expect-error -- parameter intentionally untyped; see comment above.
          title,
        ) => {
          const topLevel = (title.split('/')[0] ?? '').toLowerCase();
          const index = catalogueOrder.indexOf(topLevel);
          return index === -1 ? catalogueOrder.length : index;
        };
        const rankDifference = getRank(a.title) - getRank(b.title);

        return rankDifference !== 0
          ? rankDifference
          : a.title.localeCompare(b.title, undefined, { numeric: true });
      },
    },
  },
  decorators: [withColorScheme],
  initialGlobals: {
    [STORYBOOK_COLOR_SCHEME_GLOBAL_KEY]: STORYBOOK_COLOR_SCHEME_DEFAULT,
    backgrounds: {
      value: 'app',
    },
  },
  globalTypes: {
    [STORYBOOK_COLOR_SCHEME_GLOBAL_KEY]: {
      description: 'Material color-scheme inspection mode',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
