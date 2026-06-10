/**
 * Export module for proxy service functionality.
 *
 * This module re-exports the main functions and types needed to work with the proxy service,
 * enabling communication between different execution contexts via remote function calls.
 */

export { createClient, createService } from './proxyService';
export type { ClientObject, Provider } from './types';
export { defineCustomErrorTransformer, defineTransformer } from './defineTransformer';
