/**
 * Utilities for registering custom SuperJSON transformers.
 *
 * This module provides functions to extend serialization/deserialization capabilities
 * in the proxy service system, enabling complex data types to be transmitted between execution contexts.
 *
 * Architectural position:
 * - Layer: `src/shared/lib/proxyService` — inter-context communication infrastructure
 * - Dependencies: SuperJSON (serialization), type-fest (types)
 * - Used in: proxyService, serviceWorker for data transfer between workers and main thread
 *
 * NOT responsible for:
 * - Implementing the transformers themselves (user provides the logic)
 * - Managing the lifecycle of SuperJSON instance
 *
 * @example
 * ```ts
 * // Register a custom type transformer
 * const transformer = defineTransformer('MyType', {
 *   isApplicable: (v) => v instanceof MyType,
 *   serialize: (provider, val) => ({ id: val.id, data: val.data }),
 *   deserialize: (provider, json) => new MyType(json.id, json.data),
 * });
 * ```
 */

import type SuperJSON from 'superjson';
import type { CustomTransformer, TransformerRegistration, Provider } from './types';
import type { Constructor } from 'type-fest';
import type { SuperJSONValue } from 'superjson';
import { keys } from '../objectKeys';

/**
 * Creates a closure for registering a custom SuperJSON transformer.
 *
 * The closure pattern allows preserving types `T` (original) and `J` (JSON representation)
 * inside the returned function, avoiding the use of `any` in transformer arrays.
 *
 * @param name - Unique name for identifying the transformer in SuperJSON
 * @param transformer - Object with serialize/deserialize methods
 * @returns Closure accepting SuperJSON and Provider for registration
 *
 * @example
 * ```ts
 * // Define a custom class
 * class DocumentRef {
 *   constructor(public id: string, public title: string) {}
 * }
 *
 * // Create the transformer
 * const docTransformer = defineTransformer('DocumentRef', {
 *   isApplicable: (v): v is DocumentRef => v instanceof DocumentRef,
 *   serialize: (provider, val) => ({ id: val.id, title: val.title }),
 *   deserialize: (provider, json) => new DocumentRef(json.id, json.title),
 * });
 *
 * // Register when creating a service
 * createService(provider, 'document-service', [docTransformer]);
 * ```
 */

export const defineTransformer =
  <T, J>(name: string, transformer: CustomTransformer<T, J>): TransformerRegistration =>
  (superJson: SuperJSON, provider: Provider) => {
    superJson.registerCustom(
      {
        isApplicable: transformer.isApplicable,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Type validation happens inside isApplicable, assertion is safe
        deserialize: (val) => transformer.deserialize(provider, val as J),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/consistent-type-assertions -- SuperJSON expects JSONValue but custom transformers can return arbitrary objects; assertion is necessary for API compatibility
        serialize: (val) => transformer.serialize(provider, val) as any,
      },
      name,
    );
  };

/**
 * Registers a custom transformer for serializing/deserializing an Error subclass.
 *
 * This function ensures proper handling of user-defined errors during inter-context communication.
 * The transformer extracts standard error properties and any additional enumerable properties,
 * allowing full reconstruction of the error state in the target context.
 *
 * Workflow:
 * ```
 *   [Error instance] --serialize--> { message, name, stack, cause, ...customProps } --deserialize--> [Error instance]
 * ```
 *
 * @param identifier - Unique transformer identifier (used by SuperJSON for registration)
 * @param ErrorClass - Constructor function of the error class to use during deserialization
 * @returns TransformerRegistration callback for registration with SuperJSON
 *
 * @example
 * ```ts
 * // Define a custom error class
 * class ValidationError extends Error {
 *   public field: string;
 *   public code: string;
 *
 *   constructor(message: string, field: string, code: string) {
 *     super(message);
 *     this.name = 'ValidationError';
 *     this.field = field;
 *     this.code = code;
 *   }
 * }
 *
 * // Register the transformer when creating a service
 * createService(provider, 'validation-service', [
 *   defineCustomErrorTransformer('ValidationError', ValidationError),
 * ]);
 * ```
 */

export const defineCustomErrorTransformer =
  (identifier: string, ErrorClass: Constructor<Error>): TransformerRegistration =>
  (superJson: SuperJSON) => {
    superJson.registerCustom<Error, SuperJSONValue>(
      {
        isApplicable: (v): v is Error => v instanceof ErrorClass,
        deserialize: (v): Error => {
          const err = Object.create(ErrorClass.prototype);
          Object.assign(err, v);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Returns the constructed error object that correctly inherits methods and properties from ErrorClass.prototype
          return err;
        },
        serialize: (v: Error): SuperJSONValue => {
          // 1. Forcefully extract standard non-enumerable error properties
          const serialized: SuperJSONValue = {
            message: v.message,
            name: v.name,
            stack: v.stack,
            cause: v.cause,
          };
          // 2. Automatically collect all user-defined enumerable properties
          for (const key of keys(v)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Access to dynamic properties via bracket notation; exact type cannot be determined at compile time due to the dynamic nature of properties
            serialized[key] = v[key];
          }
          return serialized;
        },
      },
      identifier,
    );
  };
