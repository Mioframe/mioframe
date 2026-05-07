import { describe, expect, it } from 'vitest';
import { DomainError } from '.';

enum TestErrorCode {
  invalidJson = 'invalid-json',
}

describe('DomainError', () => {
  it('serializes and hydrates a stable code alongside the user-facing message', () => {
    const error = new DomainError('The selected file is not valid JSON', {
      code: TestErrorCode.invalidJson,
      cause: new SyntaxError('Unexpected end of JSON input'),
    });

    expect(error.toJSON()).toMatchObject({
      name: 'DomainError',
      message: 'The selected file is not valid JSON',
      code: TestErrorCode.invalidJson,
    });

    const restored = new DomainError(error.toJSON());

    expect(restored).toMatchObject({
      name: 'DomainError',
      message: 'The selected file is not valid JSON',
      code: TestErrorCode.invalidJson,
    });
  });
});
