---
scope:
  - src/shared/lib/typeGuards
  - src/shared/service/fileSystem
kind: pitfall
rule: Treat `FileSystemDirectoryHandle` as runtime-optional even when TypeScript types are available: guard `globalThis.FileSystemDirectoryHandle` before `instanceof`, and validate persisted handles at the storage boundary.
why: DOM typings do not guarantee the constructor exists in tests, unsupported browsers, or other non-standard runtimes. Skipping the runtime guard makes persisted-handle hydration brittle.
evidence:
  - type: code
    ref: src/shared/lib/typeGuards/isFileSystemDirectoryHandle.ts:1
    note: The guard returns false when the constructor is absent from globalThis before using instanceof.
  - type: code
    ref: src/shared/service/fileSystem/setupFileSystemDirectoryHandleService.ts:13
    note: Persisted handle records are validated through a zod custom boundary that depends on the runtime guard.
status: verified
confidence: medium
promotion-target:
  artifact: focused guard test or stronger boundary note
  ref: src/shared/lib/typeGuards/AGENTS.md
  trigger: Promote when persisted handle hydration or browser support handling changes again.
review-trigger:
  - When File System Access support, test environment globals, or persisted handle storage changes.
last-verified-at: 2026-04-12
---

This is a runtime-proof rule, not a type-level guarantee.
