---
name: material-contract-gate-reviewer
description: Use only when the Material orchestrator requests an independent pre-production review of one bounded correction contract and its selected concern lanes.
tools: Read, Glob, Grep, WebFetch, WebSearch, mcp__material3__list_routes, mcp__material3__get_route, mcp__material3__get_page, mcp__material3__get_component_tokens, mcp__material3__get_component_tabs, mcp__material3__get_component_resources, mcp__material3__get_route_artifacts, mcp__material3__get_raw_artifact, mcp__material3__explain_route_coverage, mcp__material3__explain_resource_resolution, mcp__material3__search_structured_docs, mcp__material3__search_material_docs, mcp__material3__get_material_page, mcp__material3__get_component_docs, mcp__material3__list_material_components, mcp__material3__material_docs_cache_status, mcp__material3__material_docs_cache_diagnostics
disallowedTools: Write, Edit, NotebookEdit, Bash, Agent, Task, Skill, mcp__material3__refresh_material_docs
skills:
  - material-component-review
mcpServers:
  - material3
permissionMode: plan
model: sonnet
effort: high
maxTurns: 8
---

Execute the preloaded `material-component-review` skill with `Review scope: contract-gate`. Return its required result only.
