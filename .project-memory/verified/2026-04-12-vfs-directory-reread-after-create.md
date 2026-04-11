---
scope:
  - src/shared/service/fileSystem
  - src/shared/lib/virtualFileSystem
kind: pitfall
rule: Re-read mounted directory contents by path after create events; do not trust provider create success or watch payloads to fully describe the post-create listing.
why: Some providers can acknowledge create before a subsequent directory listing catches up. Synthesizing local state from the event payload can hide stale listings and break mounted-directory refresh behavior.
evidence:
  - type: test
    ref: src/shared/service/fileSystem/useFileSystemService.test.ts:78
    note: directoryContent$ re-reads after createDirectory and emits the refreshed listing.
  - type: test
    ref: src/shared/service/fileSystem/useFileSystemService.test.ts:122
    note: A create-triggered reread can still return unchanged payload, so the next update must continue to refresh by path.
  - type: test
    ref: src/shared/service/fileSystem/googleDriveDirectoryRefresh.test.ts:52
    note: Google Drive App Data mount only shows the new folder after reread.
  - type: code
    ref: src/shared/service/fileSystem/useFileSystemService.ts:46
    note: directoryContent$ watches the path and always refetches through vfs.readDirectory.
status: verified
confidence: high
promotion-target:
  artifact: AGENTS.md or provider-contract test
  ref: src/shared/lib/virtualFileSystem/AGENTS.md
  trigger: Promote when another provider or bug fix depends on the same stale-listing contract.
review-trigger:
  - When VFS watch semantics or provider directory event payloads change.
  - When a mounted directory flow starts synthesizing local entries instead of refetching them.
last-verified-at: 2026-04-12
---

This is a runtime contract, not just a convenience refresh.
