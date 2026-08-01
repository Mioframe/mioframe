import { describe, expect, it } from 'vitest';
import {
  buildWatchdogScript,
  WATCHDOG_ACK_TIMEOUT_MS,
  WATCHDOG_PROTOCOL_VERSION,
} from '../../../../scripts/pages/lib/watchdogInject.mjs';
import { BOOT_ACK_TIMEOUT_MS } from './bootConfirmation';
import {
  APP_UPDATE_PROTOCOL_MESSAGE_TYPES,
  APP_UPDATE_PROTOCOL_VERSION,
  BOOT_ACK_OUTCOMES,
} from './protocol';

// The publisher-generated watchdog runs as plain Node ESM with no
// TypeScript loader, so it cannot import `protocol.ts`/`bootConfirmation.ts`
// directly and keeps its own literal copies instead. This test proves those
// copies stay in exact agreement with the TypeScript source of truth — the
// same proven-equivalence pattern `contracts.test.ts` already uses for the
// release descriptor validators.
describe('watchdog/protocol parity', () => {
  const script = buildWatchdogScript(1);

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

  it('uses the exact same request/response release-identity field name as protocol.ts', () => {
    // BOOT_OK, BOOT_FAILED, and GET_ACTIVATION_STATUS requests, and the
    // rollback broadcast, all key the release under `releaseNumber` — the
    // same field name `zodProtocolReleaseNumber` is assigned to in every
    // release-1 request/response schema in protocol.ts.
    expect(script).toContain('releaseNumber: RELEASE_NUMBER');
    expect(script).toContain('data.releaseNumber === RELEASE_NUMBER');
  });

  it('declares a named literal constant for every canonical boot-acknowledgement outcome from BOOT_ACK_OUTCOMES', () => {
    // Asserted as an executable `var` declaration, not merely a substring
    // that could also match inside a comment: a bare
    // `script.includes("'ignored'")` would already have passed before this
    // change, since the word appeared quoted inside a comment.
    expect(BOOT_ACK_OUTCOMES).toEqual(['committed', 'rolled-back', 'ignored', 'error']);
    expect(script).toContain("var ACK_COMMITTED = 'committed';");
    expect(script).toContain("var ACK_ROLLED_BACK = 'rolled-back';");
    expect(script).toContain("var ACK_IGNORED = 'ignored';");
    expect(script).toContain("var ACK_ERROR = 'error';");
  });

  it('checks the committed acknowledgement outcome by its named constant, not a bare string literal', () => {
    expect(script).toContain('response.ack === ACK_COMMITTED');
  });

  it('checks the boot-failure acknowledgement outcomes by their named constants, not bare string literals', () => {
    expect(script).toContain('ack === ACK_ERROR');
    expect(script).toContain('ack === ACK_ROLLED_BACK');
    expect(script).toContain('ack === ACK_IGNORED');
  });
});
