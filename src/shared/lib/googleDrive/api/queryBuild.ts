/**
 * Builds a Google Drive API query string from structured parameters.
 *
 * @param name - File name to search for (exact match).
 * @param sharedWithMe - Whether to search in "Shared with me" space.
 * @param trashed - Whether to include trashed items.
 * @param parentId - Parent folder ID to search within.
 * @returns A query string compatible with Google Drive API v3.
 *
 * @example
 * ```
 * buildQuery({ name: 'report', sharedWithMe: true })
 * // Returns: "name = 'report' and sharedWithMe = true"
 *
 * buildQuery({ parentId: 'root', trashed: false })
 * // Returns: "'root' in parents and trashed = false"
 * ```
 */
export const buildQuery = ({
  name,
  sharedWithMe,
  trashed,
  parentId,
}: {
  name?: string;
  sharedWithMe?: boolean;
  trashed?: boolean;
  parentId?: string;
}): string => {
  const queryArray: string[] = [];

  if (name) {
    queryArray.push(`name = '${name.replace(/'/g, "\\'")}'`);
  }

  if (sharedWithMe) {
    queryArray.push('sharedWithMe = true');
  }

  if (parentId) {
    queryArray.push(`'${parentId}' in parents`);
  }

  if (trashed !== undefined) {
    queryArray.push(`trashed = ${trashed ? 'true' : 'false'}`);
  }

  return queryArray.join(' and ');
};
