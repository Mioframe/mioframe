/**
 * Observable wrapper around idb-keyval for reactive data storage in IndexedDB.
 * @description
 * The class provides reactive access to data stored in IndexedDB via the `idb-keyval` library.
 * Uses `BehaviorSubject` from RxJS to ensure reactivity and instant UI updates.
 *
 * **Architectural position**:
 * - Located in the `src/shared/lib/` layer (foundation layer)
 * - Designed to abstract CRUD operations over IndexedDB with reactive updates
 * - Does not handle synchronization between multiple data sources (this is Automerge's responsibility)
 *
 * **Dependencies**:
 * - Depends on: `idb-keyval` (IndexedDB API), `rxjs/BehaviorSubject`, `zod/v4-mini` (validation)
 * - Used in: sync services, composables for reactive data access
 *
 * **Edge cases**:
 * - On initialization, the value may be `null` if the key does not exist in IndexedDB
 * - Zod validation returns an object `{ success: boolean; data?: T; error?: unknown }`
 * - If validation fails, the Observable still emits the result with `success: false`
 * @example
 * ```typescript
 * import { observableIDB } from './observableIDB';
 *
 * // Create an instance for storing user settings
 * const userSettings = new ObservableIDB<UserSettings>(
 *   'user_settings',
 *   z.object({
 *     theme: z.enum(['light', 'dark']),
 *     notifications: z.boolean(),
 *   }),
 * );
 *
 * // Subscribe to changes
 * userSettings.observable().subscribe(result => {
 *   if (result.success) {
 *     console.log('Current settings:', result.data);
 *   } else {
 *     console.error('Validation error:', result.error);
 *   }
 * });
 *
 * // Update data
 * await userSettings.set({ theme: 'dark', notifications: true });
 * ```
 */

import { set, get } from 'idb-keyval';
import type { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import type z from 'zod/v4-mini';

/**
 * Class for reactive storage and access to data in IndexedDB with Zod validation.
 * @template T - Type of stored data, must match the Zod schema
 * @param key - Unique key for storage in IndexedDB (IDBValidKey)
 * @param zod - Zod schema for data validation and serialization
 */
export class ObservableIDB<T> {
  /**
   * RxJS behavioral subject holding the current state of data.
   * Initialized with `null` until data is loaded or set.
   * @remarks
   * Emits Zod validation results: `{ success: boolean; data?: T; error?: unknown }`
   * or `null` if no data exists in IndexedDB.
   */
  private value$ = new BehaviorSubject<z.core.util.SafeParseResult<T> | null>(null);

  /**
   * ObservableIDB constructor.
   * @param key - Unique key for storing data in IndexedDB
   * @param zod - Zod schema for data validation and serialization
   * @example
   * ```typescript
   * const config = new ObservableIDB<Config>('app_config', z.object({
   *   apiUrl: z.string().url(),
   *   timeout: z.number().positive(),
   * }));
   * ```
   */
  constructor(
    private key: IDBValidKey,
    private zod: z.ZodMiniType<T>,
  ) {
    void this.init();
  }

  /**
   * Internal method to update BehaviorSubject with validation result.
   * @param v - Data to validate and store
   * @remarks
   * Uses `zod.safeParse()` for safe data validation.
   * The result is always emitted, regardless of validation success or failure.
   */
  #set(v: T) {
    this.value$.next(this.zod.safeParse(v));
  }

  /**
   * Initializes the instance by loading data from IndexedDB.
   * @returns `void` (async operation, result ignored via void)
   * @description
   * Asynchronously loads data by key from IndexedDB and updates the BehaviorSubject.
   * If no data exists in storage, emits `null`.
   * Called automatically when the class instance is created.
   * @example
   * ```typescript
   * const settings = new ObservableIDB<Settings>('user_settings', schema);
   * // init() is called automatically in the constructor
   * ```
   */
  async init() {
    const val = await get(this.key);
    this.#set(val);
  }

  /**
   * Returns an Observable for reactive observation of data changes.
   * @returns Observable emitting Zod validation results or `null`
   * @description
   * Subscribing to this Observable allows reacting to any data changes:
   * - On initialization (first value may be `null`)
   * - After calling the `set()` method
   * @example
   * ```typescript
   * const observable = userSettings.observable();
   *
   * // Subscription with success/error handling
   * observable.subscribe({
   *   next: result => {
   *     if (result.success) {
   *       console.log('Data:', result.data);
   *     } else {
   *       console.error('Validation error:', result.error);
   *     }
   *   },
   *   complete: () => console.log('Subscription completed'),
   * });
   * ```
   */
  observable(): Observable<z.z.core.util.SafeParseResult<T> | null> {
    return this.value$.asObservable();
  }

  /**
   * Asynchronously saves data to IndexedDB and updates reactive state.
   * @param newValue - New data to save
   * @returns `Promise<void>` - resolves after writing to IndexedDB and updating BehaviorSubject
   * @description
   * Two-step operation:
   * 1. Write data to IndexedDB via `idb-keyval.set()`
   * 2. Update BehaviorSubject with Zod validation result
   *
   * **Important:** Validation occurs after writing, so if validation fails,
   * data will still be saved in IndexedDB (consider adding pre-write validation).
   * @example
   * ```typescript
   * // Successful update
   * await userSettings.set({ theme: 'dark', notifications: true });
   *
   * // Handling validation error
   * try {
   *   await userSettings.set({ theme: 'invalid' }); // Zod will return error
   * } catch (error) {
   *   console.error('Error:', error);
   * }
   * ```
   */
  async set(newValue: T) {
    await set(this.key, newValue);
    this.#set(newValue);
  }
}
