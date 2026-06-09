import { getSentryReportingState, useSentry } from './sentryRuntime';
import type {
  TechnicalBreadcrumbCategory,
  TechnicalBreadcrumbData,
  TechnicalBreadcrumbLevel,
} from './technicalBreadcrumbs';

/**
 * Safe product-owned breadcrumb payload for the shared diagnostics wrapper.
 */
export type AddTechnicalBreadcrumbParams = {
  /** Technical breadcrumb category from the project-controlled category set. */
  category: TechnicalBreadcrumbCategory;
  /** Optional technical data fields. Keys are checked against the case-insensitive denylist; values are sanitized. */
  data?: TechnicalBreadcrumbData | undefined;
  /** Optional breadcrumb severity. */
  level?: TechnicalBreadcrumbLevel | undefined;
  /** Short project-controlled technical message. */
  message?: string | undefined;
};

/**
 * Adds a project-controlled technical breadcrumb to the shared Sentry runtime.
 * This is the only product-code breadcrumb API; product modules must not call Sentry directly.
 * @param breadcrumb - Safe technical breadcrumb payload.
 */
export const addTechnicalBreadcrumb = (breadcrumb: AddTechnicalBreadcrumbParams): void => {
  try {
    if (getSentryReportingState() !== 'enabled') {
      return;
    }

    const { category, data, level, message } = breadcrumb;
    useSentry().addBreadcrumb({
      category,
      ...(data !== undefined ? { data } : {}),
      ...(level !== undefined ? { level } : {}),
      ...(message !== undefined ? { message } : {}),
      type: 'default',
    });
  } catch {
    // Fire-and-forget: breadcrumb capture must never break product flows.
  }
};
