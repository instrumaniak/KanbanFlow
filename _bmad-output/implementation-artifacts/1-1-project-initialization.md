# Story 1.1: Project Initialization

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to initialize the monorepo with Vite frontend and NestJS backend,
so that the project has a solid foundation with modern tooling for building KanbanFlow.

## Acceptance Criteria

1. **Given** a fresh project directory, **When** I run the initialization commands, **Then** a monorepo structure is created with `frontend/` and `backend/` directories
2. **And** frontend uses Vite with React TypeScript template
3. **And** backend uses NestJS CLI with TypeScript
4. **And** shared `.prettierrc` is configured at root
5. **And** `frontend/` has shadcn/ui initialized with Tailwind CSS
6. **And** both projects have `package.json` with correct dependencies
7. **And** `.gitignore` covers node_modules, dist, .env files

## Tasks / Subtasks

- [ ] Task 1: Initialize frontend with Vite + React + TypeScript (AC: 1, 2)
  - [ ] Run `npm create vite@latest frontend -- --template react-ts`
  - [ ] Run `npm install` in frontend directory
  - [ ] Initialize shadcn/ui with `npx shadcn@latest init -t vite`
  - [ ] Verify Tailwind CSS v4 is configured via `@tailwindcss/vite`
  - [ ] Verify `components.json` exists for shadcn/ui config
- [ ] Task 2: Initialize backend with NestJS + TypeScript (AC: 1, 3)
  - [ ] Run `npx @nestjs/cli new backend --package-manager npm`
  - [ ] Verify `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json` exist
  - [ ] Verify NestJS module structure in `src/`
- [ ] Task 3: Configure shared tooling at monorepo root (AC: 4)
  - [ ] Create `.prettierrc` with: `semi: true, singleQuote: true, trailingComma: "all", printWidth: 100, tabWidth: 2, arrowParens: "always"`
  - [ ] Verify `.prettierrc` applies to both frontend and backend
- [ ] Task 4: Verify project configuration files (AC: 5, 6, 7)
  - [ ] Confirm `frontend/package.json` has React, Vite, Tailwind, shadcn/ui dependencies
  - [ ] Confirm `backend/package.json` has NestJS dependencies
  - [ ] Create/update `.gitignore` covering: `node_modules/`, `dist/`, `.env`, `.env.local`, `*.log`
- [ ] Task 5: Verify TypeScript strict mode (AC: 2, 3)
  - [ ] Confirm `frontend/tsconfig.json` has `strict: true`
  - [ ] Confirm `backend/tsconfig.json` has `strict: true`
  - [ ] Verify separate tsconfig for frontend (Vite) and backend (NestJS)

## Dev Notes

### Technology Stack

- **Frontend:** React 18+ with Vite (latest), TypeScript strict mode
- **Backend:** NestJS (latest), TypeScript strict mode
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`, shadcn/ui (Radix UI primitives)
- **Build:** Vite for frontend, NestJS CLI/Webpack for backend
- **Testing:** Vitest (frontend), Jest (backend - NestJS default)

### Architecture Decisions

- Monorepo structure with `frontend/` and `backend/` directories at project root
- Official Vite + NestJS CLIs — no third-party scaffolds
- Shared Prettier config at monorepo root — no project-level overrides
- shadcn/ui initialized with `npx shadcn@latest init -t vite` for proper Tailwind v4 integration [Source: architecture.md#Starter Template Evaluation]

### Initialization Commands

**Frontend:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npx shadcn@latest init -t vite
```

**Backend:**
```bash
npx @nestjs/cli new backend --package-manager npm
```

[Source: architecture.md#Starter Template Evaluation]

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

[Source: architecture.md#Implementation Patterns - Code Formatting]

### Expected Project Structure After This Story

```
KanbanFlow/
├── .prettierrc
├── .gitignore
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── components.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       └── components/
│           └── ui/
│
├── backend/
│   ├── package.json
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── src/
│       ├── main.ts
│       └── app.module.ts
```

[Source: architecture.md#Complete Project Directory Structure]

### Critical Rules

- TypeScript strict mode enabled — no `any` type allowed [Source: project-context.md#Language-Specific Rules]
- `.gitignore` must cover `node_modules`, `dist`, `.env` files [Source: epic acceptance criteria]
- shadcn/ui components go in `components/ui/` — never modify directly [Source: project-context.md#Framework-Specific Rules]
- Separate `tsconfig.json` for frontend (Vite) and backend (NestJS) [Source: project-context.md#Language-Specific Rules]
- `synchronize: false` ALWAYS for TypeORM — no auto-sync (applies in later stories but set the pattern) [Source: architecture.md#Database Migration Strategy]

### Project Structure Notes

- This is the foundational story — all subsequent stories depend on this structure
- Feature-based folder organization (`features/`) will be added in later stories as features are built
- Backend module structure (`src/auth/`, `src/boards/`, etc.) will be added per-feature
- Tests co-located with implementation files (`.spec.ts` for backend, `.test.tsx` for frontend)

### References

- [Source: architecture.md#Starter Template Evaluation] — Initialization commands and rationale
- [Source: architecture.md#Complete Project Directory Structure] — Full expected tree
- [Source: architecture.md#Implementation Patterns - Code Formatting] — Prettier config
- [Source: project-context.md#Technology Stack & Versions] — Stack details and versions
- [Source: project-context.md#Language-Specific Rules] — TypeScript and naming rules
- [Source: epics.md#Story 1.1] — Original story acceptance criteria
- [Source: ux-design-specification.md#Design System Foundation] — shadcn/ui + Tailwind CSS rationale

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
