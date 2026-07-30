/** Must match `src/shared/service/appUpdate/bootConfirmation.ts`'s `BOOT_ACK_TIMEOUT_MS`. */
export declare const WATCHDOG_ACK_TIMEOUT_MS: number;

/** Must match `src/shared/service/appUpdate/protocol.ts`'s `APP_UPDATE_PROTOCOL_VERSION`. */
export declare const WATCHDOG_PROTOCOL_VERSION: number;

/**
 * Builds the watchdog's self-contained inline script source for one release.
 * @param releaseId The exact archived release id this watchdog belongs to.
 * @returns The watchdog's JavaScript source (without `<script>` tags).
 */
export declare function buildWatchdogScript(releaseId: string): string;

/**
 * Injects the watchdog script into an archived `index.html` document, right
 * before the main module entry script tag.
 * @param html The archived release's built `index.html` content.
 * @param releaseId The exact archived release id this watchdog belongs to.
 * @returns The `index.html` content with the watchdog script injected.
 */
export declare function injectWatchdogScript(html: string, releaseId: string): string;
