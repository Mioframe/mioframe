import { describe, expect, it } from 'vitest';
import {
  buildWatchdogScript,
  WATCHDOG_ACK_TIMEOUT_MS,
  WATCHDOG_PROTOCOL_VERSION,
} from '../../../../scripts/pages/lib/watchdogInject.mjs';
import { BOOT_ACK_TIMEOUT_MS } from './bootConfirmation';
import { APP_UPDATE_PROTOCOL_MESSAGE_TYPES, APP_UPDATE_PROTOCOL_VERSION } from './protocol';

// The publisher-generated watchdog runs as plain Node ESM with no
// TypeScript loader, so it cannot import `protocol.ts`/`bootConfirmation.ts`
// directly and keeps its own literal copies instead. This test proves those
// copies stay in exact agreement with the TypeScript source of truth — the
// same proven-equivalence pattern `contracts.test.ts` already uses for the
// release descriptor validators.
describe('watchdog/protocol parity', () => {
  const script = buildWatchdogScript('release-1');

  it('uses the exact same protocol message-type literals as protocol.ts', () => {
    expect(script).toContain(`'${APP_UPDATE_PROTOCOL_MESSAGE_TYPES.BOOT_OK}'`);
    expect(script).toContain(`'${APP_UPDATE_PROTOCOL_MESSAGE_TYPES.BOOT_FAILED}'`);
    expect(script).toContain(`'${APP_UPDATE_PROTOCOL_MESSAGE_TYPES.GET_ACTIVATION_STATUS}'`);
    expect(script).toContain(`'${APP_UPDATE_PROTOCOL_MESSAGE_TYPES.ROLLBACK_BROADCAST}'`);
  });

  it('uses the exact same ack timeout as bootConfirmation.ts', () => {
    expect(WATCHDOG_ACK_TIMEOUT_MS).toBe(BOOT_ACK_TIMEOUT_MS);
    expect(script).toContain(`var ACK_TIMEOUT_MS = ${BOOT_ACK_TIMEOUT_MS};`);
  });

  it('uses the exact same protocol version as protocol.ts', () => {
    expect(WATCHDOG_PROTOCOL_VERSION).toBe(APP_UPDATE_PROTOCOL_VERSION);
    expect(script).toContain(`var PROTOCOL_VERSION = ${APP_UPDATE_PROTOCOL_VERSION};`);
  });
});
