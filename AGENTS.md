## General Agent Instructions

- Plan the implementation including edge cases, verify your plan by web search or documentation.
- TDD - do Test driven development. check coverage.
- Task Breakdown: Always break tasks into smaller, trackable todo items using `todowrite`.
- Parallel Independent Task Execution with context: Use sub-agents for tasks that can be independently done in a background process.
- after implementation check for errors, run tests, fix linting or type check error

## DB data & migration safety first

- development, testing, production - all must follow the exact db migration patterns for safe, reproducible data persistence behavior.

## Backend E2E Test Pattern: Must Always Verify DB Persists

- For ALL data modification endpoints, tests MUST verify actual database state, not just API response.
- For every PATCH/POST/DELETE test, add ONE additional assertion that verifies persistence via a different API call or DB query.
