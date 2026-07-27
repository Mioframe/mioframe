import { describe, it } from 'vitest';

import { validateE2EScenarioRegistry } from './e2eRisk.mjs';
import { validateStorybookBehaviorScenarioRegistry } from './storybookBehaviorRisk.mjs';

describe('release validation diagnostic', () => {
  it('prints invalid browser registry reasons', () => {
    const app = validateE2EScenarioRegistry();
    const storybook = validateStorybookBehaviorScenarioRegistry();

    if (!app.valid || !storybook.valid) {
      throw new Error(
        `Browser registry validation failed:\n${JSON.stringify({ app, storybook }, null, 2)}`,
      );
    }
  });
});
