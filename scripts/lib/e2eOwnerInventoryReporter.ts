import fs from 'node:fs';
import path from 'node:path';
import type { FullConfig, Reporter, Suite } from '@playwright/test/reporter';

const OUTPUT_FILE_ENV = 'MIOFRAME_E2E_OWNER_INVENTORY_OUTPUT_FILE';

/** One collected Playwright test annotation, deduplicated per spec file. */
interface CollectedAnnotation {
  type: string;
  description?: string;
}

/**
 * Playwright reporter used only in `--list` (no browser execution) mode to
 * collect the target E2E ownership inventory: every discovered spec file
 * path plus the union of its tests' annotations. Collection goes through
 * Playwright's suite/reporter API, never TypeScript source parsing, so the
 * inventory reflects exactly what Playwright itself will execute. Passed to Playwright as
 * `--reporter=` by the containerized child collector
 * `scripts/lib/e2eOwnerInventoryContainer.ts`.
 */
export default class E2EOwnerInventoryReporter implements Reporter {
  #annotationsByFile = new Map<string, CollectedAnnotation[]>();

  /**
   * Collects every discovered test's file path and annotations from the
   * Playwright suite tree.
   * @param _config Resolved Playwright config (unused).
   * @param suite Root suite Playwright collected in `--list` mode.
   */
  onBegin(_config: FullConfig, suite: Suite): void {
    for (const test of suite.allTests()) {
      const specPath = path.relative(process.cwd(), test.location.file).split(path.sep).join('/');
      const annotations = this.#annotationsByFile.get(specPath) ?? [];
      const seen = new Set(annotations.map((a) => `${a.type} ${a.description ?? ''}`));

      for (const annotation of test.annotations) {
        const key = `${annotation.type} ${annotation.description ?? ''}`;

        if (!seen.has(key)) {
          seen.add(key);
          annotations.push({ type: annotation.type, description: annotation.description });
        }
      }

      this.#annotationsByFile.set(specPath, annotations);
    }
  }

  /**
   * Writes the collected inventory as JSON to the path named by
   * {@link OUTPUT_FILE_ENV}.
   */
  onEnd(): void {
    const outputPath = process.env[OUTPUT_FILE_ENV];

    if (!outputPath) {
      throw new Error(`${OUTPUT_FILE_ENV} is required for the E2E owner inventory reporter.`);
    }

    const entries = [...this.#annotationsByFile.entries()].map(([specPath, annotations]) => ({
      specPath,
      annotations,
    }));

    fs.writeFileSync(outputPath, JSON.stringify(entries));
  }
}
