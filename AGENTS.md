## Agent Instructions

- **Task Breakdown**: Always break tasks into smaller, trackable todo items using `todowrite`. Use `pending`/`in_progress`/`completed` statuses, limit to one `in_progress` task at a time.
- **Codebase Search**: Use `codemogger_codemogger_search` as the primary exploration tool:
  - Semantic mode: Natural language queries (e.g., "how does session auth work?")
  - Keyword mode: Exact identifier lookups (e.g., "SessionGuard")
  - Prefer over Glob/Grep for codebase navigation.
- **Index Maintenance**:
  - Run `codemogger_codemogger_reindex` on the project root after creating/modifying/deleting source files to keep the search index fresh.
  - First time setup: Run `codemogger_codemogger_index` if the codebase is not yet indexed.
