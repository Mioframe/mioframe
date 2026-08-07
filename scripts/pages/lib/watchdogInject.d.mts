/**
 * Builds the watchdog's self-contained inline script source for one release.
 * @param releaseNumber The exact archived release number this watchdog belongs to.
 * @returns The watchdog's JavaScript source (without `<script>` tags).
 */
export declare function buildWatchdogScript(releaseNumber: number): string;

/**
 * Injects the watchdog script into an archived `index.html` document, right
 * before the main module entry script tag.
 * @param html The archived release's built `index.html` content.
 * @param releaseNumber The exact archived release number this watchdog belongs to.
 * @returns The `index.html` content with the watchdog script injected.
 */
export declare function injectWatchdogScript(html: string, releaseNumber: number): string;
