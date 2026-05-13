---
title: 'Backend Single-File Deployment Build'
slug: 'backend-single-file-deployment-build'
created: '2026-05-13T00:00:00.000Z'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
tech_stack: ['NestJS 11', 'TypeScript', 'TypeORM 0.3', 'MySQL 8', 'webpack', 'bcrypt']
files_to_modify:
  [
    'backend/package.json',
    'backend/nest-cli.json',
    'backend/src/app.module.ts',
    'backend/src/data-source.ts',
    'backend/src/database/typeorm-registry.ts',
    'backend/src/database/data-source-options.ts',
    'backend/src/scripts/migrate.ts',
    'backend/src/scripts/create-admin.ts',
    'backend/src/scripts/prepare-release.js',
    'backend/src/scripts/verify-release.js',
    'backend/webpack.config.js',
  ]
code_patterns:
  [
    'NestJS webpack bundling via nest build --webpack',
    'shared explicit entity registry used by both app and data-source',
    'shared DataSourceOptions builder to eliminate config triplication',
    'explicit migration class imports bundled into a single migration runner file',
    'webpack splitChunks to deduplicate shared code across app, migrate, and create-admin bundles',
    'native addon kept external with minimal runtime node_modules',
    'Node.js release helper scripts instead of shell echo for cross-platform safety',
  ]
test_patterns:
  [
    'build smoke test for all bundled artifacts (app, migrate, create-admin)',
    'release artifact verification script (file presence, non-empty, native deps, shared chunks)',
    'runtime smoke test against local test database',
    'verify migration side effects in database, not only CLI output',
    'idempotency test: re-running migration bundle on already-migrated database exits cleanly',
    'create-admin bundle smoke test (help flag and argument parsing)',
  ]
---

# Tech-Spec: Backend Single-File Deployment Build

**Created:** 2026-05-13

## Overview

### Problem Statement

The current NestJS backend ships as a standard compiled `dist/` tree and relies on TypeORM filesystem globs to discover entities and migrations. That works for local development, but it is not the right shape for a compact deployment artifact or a lightweight Docker image. We also need separate, manually runnable CLI artifacts for SSH-based production operations: migration runner and admin bootstrapping.

### Solution

Produce a deployment-focused backend release layout that contains:

1. A bundled JavaScript file for the API server (`app.js`).
2. A bundled JavaScript file for running TypeORM migrations manually (`migrate.js`).
3. A bundled JavaScript file for creating the initial admin user in production (`create-admin.js`).
4. Shared chunks extracted by webpack `splitChunks` so common code (TypeORM, mysql2, entities, utilities) is not duplicated across bundles.
5. A minimal runtime `node_modules` set only for native or unavoidable runtime dependencies.

The app bundle follows NestJS's webpack bundling path. TypeORM metadata moved away from `__dirname` glob discovery to a shared explicit entity registry so all bundles use the same source of truth. The migration runner and admin creator bundle all their dependencies via explicit imports into single self-contained files that initialize the `DataSource`, perform their operation, and exit with a non-zero status on failure so they can be run manually over SSH with no source tree present.

### Scope

**In Scope:**
- Add a webpack-based backend release build.
- Bundle the API server into one executable JavaScript file.
- Add a second bundle for manual migration execution.
- Add a third bundle for production admin bootstrapping.
- Deduplicate shared code across all bundles using webpack `splitChunks`.
- Keep native runtime dependencies available in a minimal distribution folder.
- Replace filesystem-glob entity discovery with explicit entity registration.
- Preserve the existing TypeORM migration workflow and migration table behavior.
- Keep `migrationsRun: false` in the API runtime.

**Out of Scope:**
- Frontend build changes.
- Dockerfile authoring unless needed later to consume the release output.
- Changing the database engine or ORM.
- Auto-running migrations at application startup.
- Rewriting the admin bootstrap script's business logic.

## Context for Development

### Codebase Patterns

- The backend is a NestJS 11 app with TypeScript strict mode and TypeORM 0.3.
- Domain modules already register their entities with `TypeOrmModule.forFeature(...)`.
- The app module currently wires TypeORM through `TypeOrmModule.forRootAsync(...)`.
- `src/data-source.ts` is already the shared TypeORM CLI data source.
- Migrations live in `backend/src/migrations/` and are compiled into `dist/migrations/`.
- `bcrypt` is the only clearly native runtime dependency in the backend; `mysql2` is pure JS.
- Current deployment guidance in the project context already expects migrations to run during deployment.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `backend/src/app.module.ts` | Current TypeORM app bootstrap and session store wiring |
| `backend/src/data-source.ts` | Current TypeORM CLI data source for migration commands |
| `backend/src/migrations/*` | Existing migration classes that must still run in production |
| `backend/src/scripts/create-admin.ts` | CLI entrypoint for bootstrapping the first admin user |
| `backend/package.json` | Current build and migration scripts to extend or replace |
| `backend/src/main.ts` | API server bootstrap that will become the bundled entrypoint |

### Technical Decisions

1. Use NestJS webpack bundling for the production API artifact, not a separate packager.
2. Keep one release artifact per runtime concern: `app.js` for the API, `migrate.js` for manual migration runs, and `create-admin.js` for production admin bootstrapping.
3. Move from filesystem entity discovery to a shared explicit entity registry so all runtime paths use the same source of truth.
4. Bundle migration classes into `migrate.js` via explicit imports in the migration entrypoint so the migration runner is a single self-contained file with no runtime dependency on a migration directory.
5. Use webpack `optimization.splitChunks` with `chunks: 'all'` to extract shared code (TypeORM, mysql2, entities, utilities) into a `common.js` chunk. This reduces total release size and prevents code duplication across the three bundles.
6. Treat `bcrypt` as the native runtime dependency that must be present in the minimal distribution folder.
7. Leave `migrationsRun: false` in the API runtime so DB changes remain an explicit deployment step.
8. Build and package on the same platform family as production so native module binaries match the target runtime.

## Implementation Plan

### Tasks

1. Add a backend release build path in `backend/package.json`.
   - Add scripts for an app bundle build, a migration bundle build, and an admin bundle build.
   - Keep the existing dev-oriented TypeORM commands intact unless they conflict with the release path.
2. Add a webpack configuration file at `backend/webpack.config.js`.
   - Configure a Node target.
   - Emit JS files for each entrypoint: `release/app.js`, `release/migrate.js`, and `release/create-admin.js`.
   - Configure `optimization.splitChunks` to extract shared modules into `release/common.js`.
   - Bundle regular JS dependencies.
   - Externalize `bcrypt` so the minimal runtime folder can carry the native addon explicitly.
3. Refactor `backend/src/app.module.ts`.
   - Replace glob-based entity loading with explicit entity registration.
   - Include the session entity explicitly because it is not covered by a `forFeature()` module.
   - Keep migration execution disabled in the app runtime.
4. Refactor `backend/src/data-source.ts`.
   - Import the explicit entity list and migration array from the shared registry (`backend/src/database/typeorm-registry.ts`).
   - Remove any glob-based migration or entity discovery.
   - Ensure the data source can be initialized independently for both CLI and bundled contexts.
5. Add a dedicated migration CLI entrypoint, `backend/src/scripts/migrate.ts`.
   - Import all migration classes explicitly from the shared registry.
   - Initialize the `DataSource` with the explicit entity and migration arrays.
   - Run pending migrations.
   - Exit non-zero on failure so SSH/manual execution is reliable.
6. Refactor `backend/src/scripts/create-admin.ts` for bundling.
   - Replace the inline `dataSourceOptions` object with `buildDataSourceOptions()` from the shared config.
   - Remove the `__dirname` glob migration pattern (not needed for admin creation).
   - Fix unsafe `process.exit()` calls to use `process.exitCode` with proper `finally` blocks.
7. Define the release folder assembly process.
   - Copy the bundled JS files (`app.js`, `migrate.js`, `create-admin.js`, and shared chunks) into `release/`.
   - Copy only the minimal runtime `node_modules` needed for native or externalized packages (`bcrypt` and its transitive deps).
   - No migration files need to be copied because they are bundled into `migrate.js`.
8. Validate the release artifacts against a local database.
   - Confirm the bundled API starts successfully.
   - Confirm the migration runner can apply pending migrations.
   - Confirm the create-admin bundle can parse arguments and show help.
   - Confirm migrated schema changes are visible in the database.

### Acceptance Criteria

1. **Given** the backend release build completes, **When** the deployment artifact is inspected, **Then** it contains `release/app.js`, `release/migrate.js`, `release/create-admin.js`, and shared chunks (`release/common*.js`) plus only the minimal runtime dependencies required at execution time.
2. **Given** the bundled API file is copied to a Node.js-compatible server with its minimal runtime dependencies, **When** the process starts with the required environment variables, **Then** the API boots successfully and serves requests.
3. **Given** the bundled migration file is copied to the deployment server, **When** it is executed manually over SSH with no source tree present, **Then** it applies all pending TypeORM migrations and exits successfully.
4. **Given** the bundled create-admin file is copied to the deployment server, **When** it is executed with `--help`, **Then** it displays usage information and exits successfully.
5. **Given** the API bundle starts in production mode, **When** the app initializes, **Then** it does not auto-run migrations.
6. **Given** a migration is applied through the migration runner, **When** the database is queried afterward, **Then** the schema changes are actually present, not just reported in CLI output.
7. **Given** the release build is prepared for a lightweight Docker image, **When** the image is assembled, **Then** it can omit the full source tree and keep only the release files plus the minimal native runtime dependency set.
8. **Given** the three bundles share a large amount of code, **When** the release build completes, **Then** the total size of all bundles plus shared chunks is smaller than the sum of three independent bundles.

## Additional Context

### Dependencies

- NestJS webpack bundling support.
- TypeORM compiled-JS migration execution.
- Native module handling for `bcrypt`.
- `inquirer` for interactive admin creation prompts.

### Testing Strategy

- Build the release artifacts locally and confirm all three bundles plus shared chunks are emitted.
- Start the bundled API against a test database and hit a basic endpoint.
- Run the migration bundle against a clean test database with no `migrations/` directory present and verify the migration table plus schema changes.
- Run the create-admin bundle with `--help` and verify output.
- Confirm the release output does not depend on the source tree at runtime for entity or migration discovery.
- Verify shared chunks are loaded correctly by all bundles.

### Resolved Findings

Post-implementation adversarial review produced 12 findings. The following were fixed automatically:

| Finding | Severity | Resolution |
|---|---|---|
| F1: Triplicated DataSource config | Critical | Extracted `buildDataSourceOptions()` into `database/data-source-options.ts`; used by app, CLI data source, and migration runner. |
| F2: Unsafe `process.exit()` in migrate.ts | High | Rewrote with `finally` block, protected `destroy()` with its own try/catch, and sets `process.exitCode` instead of calling `process.exit()`. |
| F4: Hardcoded bcrypt version | Medium | Replaced shell `echo` with `scripts/prepare-release.js` which reads the actual `bcrypt` version from `package.json`. |
| F5: Misleading filename | Low | Renamed `database/entities.ts` to `database/typeorm-registry.ts` to reflect both entities and migrations exports. |
| F6: `migrations: []` in app module | Low | App module now includes the full migrations array via `buildDataSourceOptions()`; `migrationsRun: false` still prevents auto-run. |
| F7: No npm script for migration bundle | Low | Added `migrate:release` script to `package.json`. |
| F9: Stale artifacts in `release/` | Low | `build:release` now runs `rm -rf release/` before webpack. |
| F10: `.gitignore` exclusion | Low | Added `release/` and `backend/release/` to `.gitignore`. |
| F11: Shell-fragile `release:install` | Medium | Replaced shell command with cross-platform `scripts/prepare-release.js` Node script. |
| F12: No automated tests for build artifacts | High | Added `scripts/verify-release.js` and `test:release` npm script that checks file presence, size, and native dependency availability. |

Skipped by design:
- **F3:** Only `bcrypt` externalized — intentional; `mysql2` is pure JS and bundles reliably.
- **F8:** Manual migration registration — required because webpack cannot bundle dynamic glob patterns.

### Notes

- The existing backend already has a deployment-oriented migration story in the architecture docs; this spec makes it release-artifact friendly.
- The biggest implementation risk is breaking TypeORM discovery by leaving any runtime path scan in place. Bundling migrations into `migrate.js` via explicit imports eliminates the migration-directory runtime dependency entirely.
- The minimal runtime `node_modules` should stay intentionally small; only native or runtime-externalized packages should remain there.
- If the native addon strategy becomes unstable across deployment platforms, the fallback is to rebuild `bcrypt` in the same target environment as the release artifact.
- Deduplication via `splitChunks` requires all bundles to be present in the same directory at runtime so they can `require()` the shared chunks. This is guaranteed by the release build process.
