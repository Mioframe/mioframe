import { describe, expect, it } from 'vitest';

import { buildContainerExtraEnv } from './visual.mjs';

describe('buildContainerExtraEnv', () => {
  it('always includes the fixed container marker', () => {
    expect(buildContainerExtraEnv({})).toEqual({
      PLAYWRIGHT_VISUAL_CONTAINER: '1',
    });
  });

  it('forwards STORYBOOK_STATIC_SKIP_BUILD only when set to exactly "1"', () => {
    expect(buildContainerExtraEnv({ STORYBOOK_STATIC_SKIP_BUILD: '1' })).toEqual({
      PLAYWRIGHT_VISUAL_CONTAINER: '1',
      STORYBOOK_STATIC_SKIP_BUILD: '1',
    });
    expect(buildContainerExtraEnv({ STORYBOOK_STATIC_SKIP_BUILD: '0' })).toEqual({
      PLAYWRIGHT_VISUAL_CONTAINER: '1',
    });
  });

  it('never forwards arbitrary host env vars on their own', () => {
    expect(buildContainerExtraEnv({ SOME_SECRET: 'x', PATH: '/usr/bin' })).toEqual({
      PLAYWRIGHT_VISUAL_CONTAINER: '1',
    });
  });
});
