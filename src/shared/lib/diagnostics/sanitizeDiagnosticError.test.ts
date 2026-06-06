import { DomainError } from '@shared/lib/error';
import { FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';
import { describe, expect, it } from 'vitest';
import { sanitizeDiagnosticError } from './sanitizeDiagnosticError';
import { attachWebFileSystemWriteDiagnosticSummary } from '@shared/lib/webFileSystemProvider/webFileSystemWriteDiagnosticSummary';

describe('sanitizeDiagnosticError', () => {
  describe('DOMException', () => {
    it('returns errorClass DOMException and domExceptionName for NotAllowedError', () => {
      const error = new DOMException('permission denied', 'NotAllowedError');
      const result = sanitizeDiagnosticError(error);

      expect(result.errorClass).toBe('DOMException');
      expect(result.domExceptionName).toBe('NotAllowedError');
      expect(result.errorClassification).toBe('accessDenied');
    });

    it('returns errorClass DOMException and domExceptionName for AbortError', () => {
      const error = new DOMException('user cancelled', 'AbortError');
      const result = sanitizeDiagnosticError(error);

      expect(result.errorClass).toBe('DOMException');
      expect(result.domExceptionName).toBe('AbortError');
      expect(result.errorClassification).toBe('accessDenied');
    });

    it('does not copy the raw DOMException message', () => {
      const error = new DOMException('user/path/secret.txt not found', 'NotFoundError');
      const result = sanitizeDiagnosticError(error);

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('user/path/secret.txt');
      expect(serialized).not.toContain('not found');
    });

    it('includes attached safe write phase and retry metadata', () => {
      const error = new DOMException('state changed', 'InvalidStateError');
      attachWebFileSystemWriteDiagnosticSummary(error, {
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
        errorClassification: 'browserFileStateChanged',
        retryAttempted: 'true',
        retryResult: 'failed',
        writePhase: 'createWritable',
      });

      const result = sanitizeDiagnosticError(error);

      expect(result).toMatchObject({
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
        errorClassification: 'browserFileStateChanged',
        retryAttempted: 'true',
        retryResult: 'failed',
        writePhase: 'createWritable',
      });
    });
  });

  describe('VfsError', () => {
    it('returns errorClass VfsError with vfsErrorCode for NoPermissions', () => {
      const error = new VfsError(FileSystemError.NoPermissions);
      const result = sanitizeDiagnosticError(error);

      expect(result.errorClass).toBe('VfsError');
      expect(result.vfsErrorCode).toBe(FileSystemError.NoPermissions);
      expect(result.errorClassification).toBe('accessDenied');
    });

    it('returns errorClass VfsError with storageFailure classification for Unknown', () => {
      const error = new VfsError(FileSystemError.Unknown);
      const result = sanitizeDiagnosticError(error);

      expect(result.errorClass).toBe('VfsError');
      expect(result.vfsErrorCode).toBe(FileSystemError.Unknown);
      expect(result.errorClassification).toBe('storageFailure');
    });

    it('returns errorClass VfsError with notFound classification for FileNotFound', () => {
      const error = new VfsError(FileSystemError.FileNotFound);
      const result = sanitizeDiagnosticError(error);

      expect(result.vfsErrorCode).toBe(FileSystemError.FileNotFound);
      expect(result.errorClassification).toBe('notFound');
    });

    it('does not copy the raw VfsError message', () => {
      const error = new VfsError(FileSystemError.Unknown, '/user/secrets/document.json');
      const result = sanitizeDiagnosticError(error);

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('/user/secrets/document.json');
    });
  });

  describe('DomainError', () => {
    it('returns errorClass DomainError and domainErrorCode when code is a string', () => {
      const error = new DomainError('Something failed', { code: 'some-domain-code' });
      const result = sanitizeDiagnosticError(error);

      expect(result.errorClass).toBe('DomainError');
      expect(result.domainErrorCode).toBe('some-domain-code');
      expect(result.errorClassification).toBe('unknown');
    });

    it('omits domainErrorCode when DomainError has no code', () => {
      const error = new DomainError('Something failed');
      const result = sanitizeDiagnosticError(error);

      expect(result.errorClass).toBe('DomainError');
      expect(result.domainErrorCode).toBeUndefined();
    });

    it('does not copy the raw DomainError message', () => {
      const error = new DomainError('Failed for /user/documents/project.json');
      const result = sanitizeDiagnosticError(error);

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('/user/documents/project.json');
    });
  });

  describe('plain Error', () => {
    it('returns errorClass Error without copying message', () => {
      const error = new Error('disk failure at /mnt/storage/key-abc123');
      const result = sanitizeDiagnosticError(error);

      expect(result.errorClass).toBe('Error');
      expect(result.errorClassification).toBe('unknown');

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('/mnt/storage/key-abc123');
      expect(serialized).not.toContain('disk failure');
    });
  });

  describe('unknown type', () => {
    it('returns errorClass unknown for null', () => {
      const result = sanitizeDiagnosticError(null);
      expect(result.errorClass).toBe('unknown');
      expect(result.errorClassification).toBe('unknown');
    });

    it('returns errorClass unknown for plain string', () => {
      const result = sanitizeDiagnosticError('raw storage error message with key=abc123');

      expect(result.errorClass).toBe('unknown');
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('abc123');
    });
  });

  describe('privacy: no leaking of paths, ids, keys, or raw messages', () => {
    it('does not include path in output for any error type', () => {
      const errors = [
        new DOMException('/secret/path', 'NotFoundError'),
        new VfsError(FileSystemError.Unknown, '/secret/path'),
        new DomainError('/secret/path'),
        new Error('/secret/path'),
        '/secret/path',
      ];

      for (const error of errors) {
        const result = sanitizeDiagnosticError(error);
        const serialized = JSON.stringify(result);
        expect(serialized).not.toContain('/secret/path');
      }
    });
  });
});
