---
title: Product Positioning and Feature Overview
summary: README-derived overview of Beaver positioning (local-first, no cloud), storage/sync model (OPFS/local folder + CRDT), roadmap checklist, and licensing (FSL).
tags: []
related: [repo_guidelines/package_scripts/context.md]
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-04-18T13:44:05.067Z'
updatedAt: '2026-04-18T13:44:05.067Z'
---

## Reason

Capture durable product positioning, storage/sync model, and feature roadmap from README (EN/RU).

## Raw Concept

**Task:**
Document README product positioning and feature/roadmap overview

**Changes:**

- Replaced Apple-specific AirDrop mentions with neutral file-transfer language in README.md and README.ru.md

**Files:**

- README.md
- README.ru.md
- DEVELOPMENT.md

**Flow:**
choose storage (OPFS or local folder) -> create/edit tables/records -> export/import JSON -> move files between devices -> CRDT merges data

**Timestamp:** 2026-04-18

## Narrative

### Structure

README.md (English) and README.ru.md (Russian) describe Beaver as a local-first personal data app, outline key value propositions, and list implemented features and plans as checklists.

### Dependencies

References browser OPFS for storage and a CRDT-based data format for merging changes when syncing via file transfer. Development instructions are delegated to DEVELOPMENT.md.

### Highlights

Core claims: no registration, no hosted backend, offline by default, local storage choice (OPFS or local folder), sync/merge via CRDT, and a public roadmap checklist for upcoming UI views and modeling features.

### Rules

The README contains user-facing guidance and a feature checklist; development setup and tooling instructions live in DEVELOPMENT.md.

## Facts

- **product_positioning**: Beaver is a simple local app for personal data; it is not a cloud service and has no registration or hosted backend. [project]
- **data_storage_options**: Data storage options include browser OPFS storage or a user-selected local folder on the device. [project]
- **offline_mode**: Beaver supports offline use by default. [project]
- **sync_model**: Beaver uses a CRDT-based data format for syncing/merging when moving files between devices without overwriting work. [project]
- **license**: License is Functional Source License (FSL) with a 3 years non-compete term. [project]
- **roadmap_location**: Current implemented/planned features are tracked in the README as a checklist across workspace, modeling, entry, presentation, and management. [convention]
- **documentation_change**: Recent documentation change: removed Apple-specific README wording by replacing AirDrop mentions with neutral file-transfer language in README.md and README.ru.md. [project]
