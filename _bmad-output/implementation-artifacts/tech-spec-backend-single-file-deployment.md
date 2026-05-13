---
title: 'Backend Single-File Deployment Build'
slug: 'backend-single-file-deployment-build'
created: '2026-05-13T00:00:00.000Z'
status: 'review'
stepsCompleted: [1]
tech_stack: ['NestJS 11', 'TypeScript', 'TypeORM 0.3', 'MySQL 8', 'webpack', 'bcrypt']
files_to_modify:
  [
    'backend/package.json',
    'backend/nest-cli.json',
    'backend/src/app.module.ts',
    'backend/src/data-source.ts',
    'backend/src/database/entities.ts',
    'backend/src/scripts/migrate.ts',
    'backend/webpack.config.js',
  ]
code_patterns:
  [
    'NestJS webpack bundling via nest build --webpack',
    'shared explicit entity registry used by both app and data-source',
    'explicit migration class imports bundled into a single migration runner file',
    'native addon kept external with minimal runtime node_modules',
  ]
test_patterns:
  [
    'build smoke test for bundled app and migration runner',
    'runtime smoke test against local test database',
    'verify migration side effects in database, not only CLI output',
  ]
---

# Tech-Spec: Backend Single-File Deployment Build

**Created:** 2026-05-13

## Overview

### Problem Statement

The current NestJS backend ships as a standard compiled `dist/` tree and relies on TypeORM filesystem globs to discover entities and migrations. That works for local development, but it is not the right shape for a compact deployment artifact or a lightweight Docker image. We also need a separate, manually runnable migration artifact for SSH-based production operations.

### Solution

Produce a deployment-focused backend release layout that contains:

1. A single bundled JavaScript file for the API server.
2. A separate single bundled JavaScript file for running TypeORM migrations manually.
3. A minimal runtime `node_modules` set only for native or unavoidable runtime dependencies.

The app bundle should follow NestJS's webpack bundling path. TypeORM metadata should move away from `__dirname` glob discovery and instead use a shared explicit entity registry so both bundles use the same source of truth. The migration runner should bundle all migration classes via explicit imports into a single self-contained `migrate.js` file that initializes the `DataSource`, runs pending migrations, and exits with a non-zero status on failure so it can be run manually over SSH with no source tree present.

### Scope

**In Scope:**
- Add a webpack-based backend release build.
- Bundle the API server into one executable JavaScript file.
- Add a second bundle for manual migration execution.
- Keep native runtime dependencies available in a minimal distribution folder.
- Replace filesystem-glob entity discovery with explicit entity registration.
- Preserve the existing TypeORM migration workflow and migration table behavior.
- Keep `migrationsRun: false` in the API runtime.

**Out of Scope:**
- Frontend build changes.
- Dockerfile authoring unless needed later to consume the release output.
- Changing the database engine or ORM.
- Auto-running migrations at application startup.
- Rewriting the admin bootstrap script unless a later deployment requirement asks for it.

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
| `backend/src/scripts/create-admin.ts` | Existing example of a CLI-style backend entrypoint |
| `backend/package.json` | Current build and migration scripts to extend or replace |
| `backend/src/main.ts` | API server bootstrap that will become the bundled entrypoint |

### Technical Decisions

1. Use NestJS webpack bundling for the production API artifact, not a separate packager.
2. Keep one release artifact per runtime concern: `app.js` for the API and `migrate.js` for manual migration runs.
3. Move from filesystem entity discovery to a shared explicit entity registry so both runtime paths use the same source of truth.
4. Bundle migration classes into `migrate.js` via explicit imports in the migration entrypoint so the migration runner is a single self-contained file with no runtime dependency on a migration directory.
5. Treat `bcrypt` as the native runtime dependency that must be present in the minimal distribution folder.
6. Leave `migrationsRun: false` in the API runtime so DB changes remain an explicit deployment step.
7. Build and package on the same platform family as production so native module binaries match the target runtime.

## Implementation Plan

### Tasks

1. Add a backend release build path in `backend/package.json`.
   - Add scripts for an app bundle build and a migration bundle build.
   - Keep the existing dev-oriented TypeORM commands intact unless they conflict with the release path.
2. Add a webpack configuration file at `backend/webpack.config.js`.
   - Configure a Node target.
   - Emit a single JS file for each entrypoint: `release/app.js` and `release/migrate.js`.
   - Bundle regular JS dependencies.
   - Externalize `bcrypt` so the minimal runtime folder can carry the native addon explicitly.
3. Refactor `backend/src/app.module.ts`.
   - Replace glob-based entity loading with explicit entity registration.
   - Include the session entity explicitly because it is not covered by a `forFeature()` module.
   - Keep migration execution disabled in the app runtime.
4. Refactor `backend/src/data-source.ts`.
   - Import the explicit entity list and migration array from the shared registry (`backend/src/database/entities.ts`).
   - Remove any glob-based migration or entity discovery.
   - Ensure the data source can be initialized independently for both CLI and bundled contexts.
5. Add a dedicated migration CLI entrypoint, `backend/src/scripts/migrate.ts`.
   - Import all migration classes explicitly from the shared registry.
   - Initialize the `DataSource` with the explicit entity and migration arrays.
   - Run pending migrations.
   - Exit non-zero on failure so SSH/manual execution is reliable.
6. Define the release folder assembly process.
   - Copy the bundled JS files (`app.js`, `migrate.js`) into `release/`.
   - Copy only the minimal runtime `node_modules` needed for native or externalized packages (`bcrypt` and its transitive deps).
   - No migration files need to be copied because they are bundled into `migrate.js`.
7. Validate the release artifacts against a local database.
   - Confirm the bundled API starts successfully.
   - Confirm the migration runner can apply pending migrations.
   - Confirm migrated schema changes are visible in the database.

### Acceptance Criteria

1. **Given** the backend release build completes, **When** the deployment artifact is inspected, **Then** it contains `release/app.js` and `release/migrate.js` plus only the minimal runtime dependencies required at execution time.
2. **Given** the bundled API file is copied to a Node.js-compatible server with its minimal runtime dependencies, **When** the process starts with the required environment variables, **Then** the API boots successfully and serves requests.
3. **Given** the bundled migration file is copied to the deployment server, **When** it is executed manually over SSH with no source tree present, **Then** it applies all pending TypeORM migrations and exits successfully.
4. **Given** the API bundle starts in production mode, **When** the app initializes, **Then** it does not auto-run migrations.
5. **Given** a migration is applied through the migration runner, **When** the database is queried afterward, **Then** the schema changes are actually present, not just reported in CLI output.
6. **Given** the release build is prepared for a lightweight Docker image, **When** the image is assembled, **Then** it can omit the full source tree and keep only the release files plus the minimal native runtime dependency set.

## Additional Context

### Dependencies

- NestJS webpack bundling support.
- TypeORM compiled-JS migration execution.
- Native module handling for `bcrypt`.

### Testing Strategy

- Build the release artifacts locally and confirm both bundles are emitted.
- Start the bundled API against a test database and hit a basic endpoint.
- Run the migration bundle against a clean test database with no `migrations/` directory present and verify the migration table plus schema changes.
- Confirm the release output does not depend on the source tree at runtime for entity or migration discovery.

### Notes

- The existing backend already has a deployment-oriented migration story in the architecture docs; this spec makes it release-artifact friendly.
- The biggest implementation risk is breaking TypeORM discovery by leaving any runtime path scan in place. Bundling migrations into `migrate.js` via explicit imports eliminates the migration-directory runtime dependency entirely.
- The minimal runtime `node_modules` should stay intentionally small; only native or runtime-externalized packages should remain there.
- If the native addon strategy becomes unstable across deployment platforms, the fallback is to rebuild `bcrypt` in the same target environment as the release artifact.
