import { useSentry } from '@shared/lib/setupSentry';
import type {
  TechnicalBreadcrumbCategory,
  TechnicalBreadcrumbData,
  TechnicalBreadcrumbLevel,
} from '@shared/lib/sentry/technicalBreadcrumbs';

/**
 * Safe product-owned breadcrumb payload for the shared diagnostics wrapper.
 */
export type AddTechnicalBreadcrumbParams = {
  /** Technical breadcrumb category allowlisted by the shared Sentry sanitizer. */
  category: TechnicalBreadcrumbCategory;
  /** Optional allowlisted technical data fields. */
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
    useSentry().addBreadcrumb({
      category: breadcrumb.category,
      ...(breadcrumb.data !== undefined ? { data: breadcrumb.data } : {}),
      ...(breadcrumb.level !== undefined ? { level: breadcrumb.level } : {}),
      ...(breadcrumb.message !== undefined ? { message: breadcrumb.message } : {}),
      type: 'default',
    });
  } catch {
    // Fire-and-forget: breadcrumb capture must never break product flows.
  }
};
