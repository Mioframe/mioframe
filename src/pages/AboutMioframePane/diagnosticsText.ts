/** Inputs used to render the plain-text diagnostics snapshot. */
export interface DiagnosticsTextInput {
  /** Display name of the application. */
  appName: string;
  /** Application version string. */
  appVersion: string;
  /** ISO build date of the running build. */
  appBuildDate: string;
  /** Build identifier, when available. */
  appBuildId: string | undefined;
  /** Whether Sentry diagnostics are available in this build. */
  diagnosticsAvailable: boolean;
  /** Whether diagnostics are effectively enabled (available and not opted out). */
  diagnosticsEnabled: boolean;
  /** Whether Google Drive integration is available in this build. */
  googleDriveAvailable: boolean;
  /** Raw `navigator.userAgent` string. */
  userAgent: string;
  /** Detected OS platform, when available. */
  platform: string | undefined;
}

/**
 * Builds the plain-text diagnostics snapshot copied to the clipboard from the About pane.
 * @param input - Diagnostics fields to render.
 * @returns Multi-line plain-text diagnostics snapshot.
 */
export const getDiagnosticsText = (input: DiagnosticsTextInput): string => {
  const lines = [
    `App: ${input.appName}`,
    `Version: ${input.appVersion}`,
    `Build date: ${input.appBuildDate}`,
    ...(input.appBuildId ? [`Build id: ${input.appBuildId}`] : []),
    `Diagnostics available: ${input.diagnosticsAvailable ? 'yes' : 'no'}`,
    `Diagnostics enabled: ${input.diagnosticsEnabled ? 'yes' : 'no'}`,
    `Google Drive available: ${input.googleDriveAvailable ? 'yes' : 'no'}`,
    `Browser: ${input.userAgent}`,
    ...(input.platform ? [`Platform: ${input.platform}`] : []),
  ];

  return lines.join('\n');
};

/**
 * Extracts a usable platform string from `navigator.userAgentData`, if present and valid.
 * @param userAgentData - Value read from `navigator.userAgentData`.
 * @returns Platform string, or `undefined` when unavailable or invalid.
 */
export const getPlatformFromUserAgentData = (userAgentData: unknown): string | undefined => {
  if (!userAgentData || typeof userAgentData !== 'object') {
    return undefined;
  }

  const platform = Reflect.get(userAgentData, 'platform');
  return typeof platform === 'string' && platform ? platform : undefined;
};
