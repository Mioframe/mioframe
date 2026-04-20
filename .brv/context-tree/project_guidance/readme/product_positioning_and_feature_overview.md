---
title: Product Positioning and Feature Overview
summary: README-derived overview of Beaver positioning (local-first, no cloud), storage/sync model (OPFS/local folder + CRDT), roadmap checklist, and licensing (FSL).
tags: []
related: [repo_guidelines/package_scripts/context.md]
keywords: []
importance: 53
recency: 1
maturity: draft
accessCount: 1
createdAt: '2026-04-18T13:44:05.067Z'
updatedAt: '2026-04-18T13:44:05.067Z'
---

## Abstract

The README positions Beaver as an offline-by-default, local-first personal data app (no registration or backend) storing data in OPFS or a local folder, syncing via CRDT file transfers with a roadmap checklist and FSL licensing.

## Key points

- Beaver is positioned as a **local-first personal data app**, explicitly **not a cloud service**: **no registration** and **no hosted backend**.
- Supports **offline-by-default** usage.
- Offers two **storage options**: **browser OPFS** or a **user-selected local folder** on the device.
- **Sync/merge model**: users move files between devices via **generic file transfer**, and a **CRDT-based data format** merges changes to avoid overwriting work.
- **Roadmap and feature status** are maintained as **README checklists** spanning multiple product areas (workspace, modeling, entry, presentation, management).
- **Licensing**: **Functional Source License (FSL)** with a **3-year non-compete** term.
- Documentation maintenance note: README wording was updated to remove **Apple-specific AirDrop** mentions in favor of neutral file-transfer language.

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

## Notable entities, patterns, or decisions mentioned

- **Entities / technologies**
  - **OPFS (Origin Private File System)** as a browser storage mechanism.
  - **CRDT** as the merge/synchronization data format/strategy.
  - **Export/import JSON** as part of the data portability workflow.
  - Documents: `README.md`, `README.ru.md`, `DEVELOPMENT.md`; related: `repo_guidelines/package_scripts/context.md`.
- **Patterns**
  - **Local-first + file-based sync**: users synchronize by transferring local files (not via a server).
  - **Checklist-driven roadmap** embedded directly in README for transparency and tracking.
  - **Doc layering**: README for user-facing overview; `DEVELOPMENT.md` for setup/tooling.
- **Decisions**
  - Product stance: **no cloud**, **no accounts**, **offline-first**.
  - Storage choice offered to users: **OPFS vs local folder**.
  - Sync approach: **CRDT merging** to prevent overwrites during multi-device file transfer.
  - Licensing choice: **FSL with a 3-year non-compete**.
  - Documentation decision: remove platform-specific (Apple/AirDrop) terminology in favor of neutral phrasing.
