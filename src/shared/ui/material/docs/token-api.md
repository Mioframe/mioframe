# Material token API pointer

The former central token catalogue has been retired.

Canonical token ownership is executable and local:

- `foundation/tokens.css` and `foundation/theme.css` own supported `--md-ref-*` and `--md-sys-*` roles;
- `components/<family>/tokens.css` owns and catalogues that family’s public official `--md-comp-*` contract;
- renderer `--m3e-*` and `--md-private-*` inputs remain private;
- application `--app-*` tokens remain outside Material.

Do not add token rows to this file and do not use it as a registry. See [`component-tokens.md`](./component-tokens.md) for the current contract.

This file remains only as a compatibility pointer for historical pre-contract family artifacts that linked to the old catalogue. It may be removed after those artifacts have been converted or deleted.
