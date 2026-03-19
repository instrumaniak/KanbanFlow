---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-03-19'
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
workflowType: 'architecture'
project_name: 'trello-clone'
user_name: 'Raziur'
date: '2026-03-19'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
49 functional requirements spanning 6 categories:
- Authentication (FR1-FR4): Registration, login, logout, registration toggle
- Project Management (FR5-FR9): CRUD, cascade delete, board organization
- Board Management (FR10-FR17): CRUD, background color, archive/restore
- Column Management (FR18-FR22): CRUD, sorting, move-all-cards
- Card Management (FR23-FR37): CRUD, markdown, labels, due dates, checklists, drag-drop, search/filter
- Administration (FR43-FR49): User management, activity logs, CLI superadmin creation

**Non-Functional Requirements:**
17 NFRs across 4 categories:
- Performance (NFR1-NFR5): Page <2s, board <1s, drag-drop <100ms, API <500ms
- Security (NFR6-NFR10): bcrypt hashing, session tokens, CSRF, XSS prevention, rate limiting
- Reliability (NFR11-NFR14): Data persistence, CRUD reliability, graceful error handling
- Accessibility (NFR15-NFR17): Keyboard navigation, ARIA labels, focus management

**Scale & Complexity:**
- Primary domain: Full-stack web SPA (React/Vite frontend, NestJS backend, MySQL database)
- Complexity level: Low — single-user focused, no multi-tenancy, no real-time in MVP
- Estimated architectural components: ~8-10 (Auth, Project, Board, Column, Card, Checklist, Label, Admin, API Gateway, Database)

### Technical Constraints & Dependencies

- **Deployment:** cPanel Node.js app feature — must be compatible with shared hosting
- **Stack:** React/Vite, NestJS, MySQL — fixed by PRD
- **UI Framework:** shadcn/ui (Radix UI primitives) with Tailwind CSS
- **Drag-drop:** dnd-kit library for accessible, touch-supportive drag interactions
- **No offline requirement:** Server-dependent by design
- **No WebSocket in MVP:** Real-time updates deferred to post-MVP growth features

### Cross-Cutting Concerns Identified

- **Authentication/Authorization:** Session-based auth protecting all user data, admin role enforcement
- **CRUD consistency:** Reliable persistence for Projects, Boards, Columns, Cards, Checklists with cascade deletes
- **Drag-drop state management:** Optimistic UI updates with server sync for card movement
- **Dark mode theming:** System preference detection + manual toggle, CSS variable-based theming
- **Responsive layout:** Desktop-first with tablet/mobile adaptation (single column on mobile, bottom sheet sidebar)
- **Accessibility compliance:** WCAG AA — keyboard navigation, ARIA labels, focus management, screen reader support
- **Markdown rendering:** Sanitized markdown preview for card descriptions (XSS prevention)

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web SPA — React/Vite frontend, NestJS backend, MySQL database

### Selected Starter: Official Vite + NestJS CLIs

**Rationale for Selection:**
PRD already specifies the complete tech stack. Using official CLIs for both frontend and backend ensures:
- Minimal opinion overhead — we build exactly what the PRD requires
- Official maintenance and community support
- Well-documented upgrade paths
- No vendor lock-in from third-party scaffolds

**Initialization Commands:**

Frontend:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npx shadcn@latest init -t vite
```

Backend:
```bash
npx @nestjs/cli new backend --package-manager npm
```

**Architectural Decisions Provided by Starters:**

**Language & Runtime:**
- TypeScript (strict mode) for both frontend and backend
- Node.js runtime for backend

**Styling Solution:**
- Tailwind CSS v4 via `@tailwindcss/vite`
- shadcn/ui components (Radix UI primitives)
- CSS variables for theming (dark mode support)

**Build Tooling:**
- Vite for frontend (fast HMR, optimized builds)
- NestJS CLI / Webpack for backend compilation

**Testing Framework:**
- Vitest for frontend unit tests
- Jest for backend unit tests (NestJS default)

**Code Organization:**
- Frontend: Feature-based folder structure under `src/`
- Backend: NestJS module-based architecture (`src/modules/`)
- Monorepo root with `frontend/` and `backend/` directories

**Development Experience:**
- Vite dev server with instant HMR (~200ms startup)
- NestJS watch mode for backend hot reload
- Separate dev servers on different ports

**Note:** Project initialization should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- ORM: TypeORM — determines data layer architecture
- Session management: Cookie-based — determines auth flow
- API docs: Swagger — determines API contract visibility

**Important Decisions (Shape Architecture):**
- Frontend structure: Feature-based — determines code organization
- Config management: NestJS ConfigModule — determines environment handling

**Deferred Decisions (Post-MVP):**
- Real-time: WebSocket (post-MVP growth feature)
- Caching: None for MVP (low complexity, single user)
- CI/CD: Manual deployment for MVP (solo developer on cPanel)

### Data Architecture

| Decision | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| ORM | TypeORM | Latest stable | NestJS-native integration, decorator-based entities |
| Database | MySQL | 8.x | Specified by PRD, widely supported |
| Migrations | TypeORM migrations | — | Auto-generated from entity changes |
| Caching | None (MVP) | — | Low complexity, single user, defer to post-MVP |

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Session management | Cookie-based (httpOnly) | Simpler, more secure for self-hosted, SameSite CSRF protection |
| Password hashing | bcrypt | Specified by NFR6 |
| CSRF protection | SameSite cookies + CSRF tokens | NFR8 compliance |
| XSS prevention | Sanitized markdown output | NFR9 — DOMPurify for markdown rendering |
| Rate limiting | `@nestjs/throttler` | NFR10 — protect auth endpoints |

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API style | REST | SPA architecture, standard CRUD patterns |
| API docs | Swagger/OpenAPI via `@nestjs/swagger` | Auto-generated from decorators, interactive testing |
| Error handling | NestJS exception filters | Consistent error responses across all endpoints |
| Response format | JSON | Standard for REST APIs |

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component structure | Feature-based folders | Groups related components, hooks, types by domain |
| State management | React Query (TanStack Query) | Server state management, caching, optimistic updates |
| Routing | React Router | Specified by PRD |
| Styling | Tailwind CSS v4 + shadcn/ui | Specified by UX design, CSS variables for theming |
| Drag-drop | dnd-kit | Accessible, touch-supportive, specified by UX |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Config management | NestJS ConfigModule | Typed config, validation on startup |
| Deployment target | cPanel Node.js app | Specified by PRD |
| Environment | `.env` files with validation | ConfigModule handles validation |
| Build | Vite (frontend), NestJS CLI (backend) | Official tooling for each |

### Decision Impact Analysis

**Implementation Sequence:**
1. Project initialization (Vite + NestJS CLIs)
2. Database setup (MySQL + TypeORM entities)
3. Authentication (cookie sessions + bcrypt)
4. Core CRUD (Projects → Boards → Columns → Cards)
5. Frontend components (feature-based structure)
6. Drag-drop (dnd-kit integration)
7. Admin panel
8. Polish (dark mode, accessibility, search/filter)

**Cross-Component Dependencies:**
- Auth module protects all API endpoints — must be built first after DB
- Board/Column/Card share cascade delete logic — TypeORM relations handle this
- Drag-drop requires optimistic UI updates — React Query mutations
- Dark mode requires CSS variables established early in frontend setup

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 5 areas where AI agents could make different choices

### Naming Patterns

**Database Naming Conventions:**
- Tables: `snake_case` plural (e.g., `users`, `boards`, `cards`)
- Columns: `snake_case` (e.g., `created_at`, `board_id`, `is_archived`)
- Foreign keys: `{referenced_table}_id` (e.g., `board_id`, `column_id`)
- Indexes: `idx_{table}_{columns}` (e.g., `idx_cards_column_id`)
- Primary keys: `id` (auto-increment integer)

**API Naming Conventions:**
- Endpoints: RESTful `kebab-case` plural (e.g., `/api/boards`, `/api/card-labels`)
- Route parameters: `:id` format (e.g., `/api/boards/:id`)
- Query parameters: `camelCase` (e.g., `sortBy`, `isArchived`)
- NestJS controllers: `{Resource}Controller` (e.g., `BoardsController`)
- NestJS services: `{Resource}Service` (e.g., `BoardsService`)

**Code Naming Conventions:**
- Backend files: `kebab-case` (e.g., `board.entity.ts`, `create-board.dto.ts`)
- Frontend components: `PascalCase` (e.g., `BoardView.tsx`, `CardItem.tsx`)
- Frontend files: `kebab-case` matching component (e.g., `board-view.tsx`, `card-item.tsx`)
- TypeScript interfaces: `PascalCase` with `I` prefix for NestJS (e.g., `IBoard`), no prefix for frontend
- Functions/methods: `camelCase` (e.g., `getBoardById`, `createCard`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_COLUMNS_PER_BOARD`)

### Structure Patterns

**Backend Organization (NestJS):**
```
backend/src/
├── auth/               # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/
│   └── strategies/
├── users/              # Users module
├── projects/           # Projects module
├── boards/             # Boards module
├── columns/            # Columns module
├── cards/              # Cards module
├── checklists/         # Checklists module
├── labels/             # Labels module
├── admin/              # Admin module
├── common/             # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/             # Configuration
└── main.ts
```

**Frontend Organization (React/Vite):**
```
frontend/src/
├── features/
│   ├── auth/           # Login, register, auth context
│   ├── projects/       # Project list, project page
│   ├── boards/         # Board view, board settings
│   ├── columns/        # Column component, column actions
│   ├── cards/          # Card component, card detail, drag-drop
│   ├── checklists/     # Checklist component, progress bar
│   ├── labels/         # Label picker, label badges
│   ├── search/         # Search and filter components
│   └── admin/          # Admin panel components
├── components/
│   └── ui/             # shadcn/ui components (auto-generated)
├── hooks/              # Shared custom hooks
├── lib/                # Utilities, API client, types
│   ├── api.ts          # API client setup
│   ├── utils.ts        # General utilities
│   └── types.ts        # Shared TypeScript types
├── layouts/            # Layout components
└── App.tsx
```

**Test Organization:**
- Backend: Co-located `.spec.ts` files (e.g., `boards.service.spec.ts`)
- Frontend: Co-located `.test.tsx` files (e.g., `board-view.test.tsx`)

### Format Patterns

**API Response Formats:**
```typescript
// Success response
{
  data: T,
  message?: string
}

// List response
{
  data: T[],
  total: number
}

// Error response
{
  statusCode: number,
  message: string | string[],
  error: string
}
```

**Data Exchange Formats:**
- JSON fields: `camelCase` in API responses (TypeORM handles conversion from snake_case DB)
- Dates: ISO 8601 strings (e.g., `"2026-03-19T12:00:00.000Z"`)
- Booleans: `true`/`false` (never 1/0)
- Null: Use `null`, not empty string for missing values

### Process Patterns

**Error Handling:**
- Backend: Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, etc.)
- Backend: Global exception filter formats all errors consistently
- Frontend: React Query `onError` handlers display toast notifications
- Frontend: Form validation errors shown inline below fields
- User-facing messages: Friendly, actionable (e.g., "Board not found" not "404 Error")

**Loading States:**
- Backend: No loading states (synchronous API responses)
- Frontend: Skeleton screens for initial page loads
- Frontend: Optimistic updates for drag-drop (no spinner)
- Frontend: Spinner on buttons for form submissions
- React Query: `isLoading`, `isError`, `isSuccess` states

**Authentication Flow:**
- Login: POST `/api/auth/login` → sets httpOnly cookie → returns user data
- Register: POST `/api/auth/register` → creates user → auto-login
- Logout: POST `/api/auth/logout` → clears cookie
- Session check: GET `/api/auth/me` → returns current user or 401
- Protected routes: NestJS `@UseGuards(AuthGuard)` decorator

**Code Formatting:**
- Backend & Frontend: Prettier with shared `.prettierrc` at monorepo root
- Recommended config:
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
- Format on save via editor integration
- Pre-commit hook via `lint-staged` + `husky` to enforce formatting
- NestJS + TypeScript: ESLint handles linting, Prettier handles formatting (no conflicts)

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow the naming conventions exactly as specified
- Use the established folder structure for new files
- Return API responses in the defined format
- Handle errors using NestJS exceptions on backend
- Use React Query for all server state management
- Use shadcn/ui components from `components/ui/` directory
- Co-locate tests with the files they test
- Run Prettier before committing code
- Never override Prettier formatting with manual adjustments
- Use the shared `.prettierrc` config — no project-level overrides

**Pattern Verification:**
- ESLint enforces code naming conventions
- TypeScript strict mode catches type mismatches
- API responses validated against Swagger schema
- Prettier enforces consistent code formatting
- PR review checks folder structure compliance

### Pattern Examples

**Good Example — Backend Controller:**
```typescript
@Controller('boards')
@UseGuards(AuthGuard)
export class BoardsController {
  @Get()
  findAll(@Query() query: ListBoardsDto): Promise<Board[]> {
    return this.boardsService.findAll(query);
  }

  @Post()
  @HttpCode(201)
  create(@Body() createBoardDto: CreateBoardDto): Promise<Board> {
    return this.boardsService.create(createBoardDto);
  }
}
```

**Good Example — Frontend Component:**
```typescript
// features/boards/board-view.tsx
export function BoardView({ boardId }: BoardViewProps) {
  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => api.getBoard(boardId),
  });

  if (isLoading) return <BoardSkeleton />;
  if (!board) return <NotFound />;

  return (
    <div className="flex gap-6 overflow-x-auto p-6">
      {board.columns.map((column) => (
        <Column key={column.id} column={column} />
      ))}
    </div>
  );
}
```

**Anti-Patterns to Avoid:**
- ❌ Mixing `snake_case` and `camelCase` in the same layer
- ❌ Creating new folder structures outside the established patterns
- ❌ Returning raw database errors to the frontend
- ❌ Using `any` type — always define proper TypeScript types
- ❌ Fetching data without React Query (e.g., raw `fetch` in components)
- ❌ Building custom UI components when shadcn/ui equivalent exists
- ❌ Mixing formatting styles — Prettier enforces one style across entire codebase
- ❌ Disabling Prettier for specific files without team consensus

## Project Structure & Boundaries

### Complete Project Directory Structure

```
trello-clone/
├── .prettierrc                    # Shared Prettier config
├── .gitignore                     # Git ignore rules
├── README.md                      # Project documentation
│
├── frontend/                      # React/Vite SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── components.json            # shadcn/ui config
│   ├── index.html
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── main.tsx               # Entry point
│       ├── App.tsx                # Root component + router
│       ├── index.css              # Tailwind + CSS variables (theming)
│       ├── vite-env.d.ts
│       ├── components/
│       │   └── ui/                # shadcn/ui components (auto-generated)
│       │       ├── button.tsx
│       │       ├── dialog.tsx
│       │       ├── dropdown-menu.tsx
│       │       ├── input.tsx
│       │       ├── toast.tsx
│       │       └── ...
│       ├── features/
│       │   ├── auth/
│       │   │   ├── login-form.tsx
│       │   │   ├── register-form.tsx
│       │   │   ├── auth-provider.tsx
│       │   │   ├── use-auth.ts
│       │   │   └── auth.api.ts
│       │   ├── projects/
│       │   │   ├── project-list.tsx
│       │   │   ├── project-card.tsx
│       │   │   ├── create-project-dialog.tsx
│       │   │   ├── use-projects.ts
│       │   │   └── projects.api.ts
│       │   ├── boards/
│       │   │   ├── board-view.tsx
│       │   │   ├── board-header.tsx
│       │   │   ├── board-settings.tsx
│       │   │   ├── archived-boards.tsx
│       │   │   ├── use-boards.ts
│       │   │   └── boards.api.ts
│       │   ├── columns/
│       │   │   ├── column.tsx
│       │   │   ├── column-header.tsx
│       │   │   ├── column-card-list.tsx
│       │   │   ├── add-column-button.tsx
│       │   │   ├── use-columns.ts
│       │   │   └── columns.api.ts
│       │   ├── cards/
│       │   │   ├── card.tsx
│       │   │   ├── card-detail.tsx
│       │   │   ├── card-form.tsx
│       │   │   ├── card-labels.tsx
│       │   │   ├── add-card-input.tsx
│       │   │   ├── use-cards.ts
│       │   │   └── cards.api.ts
│       │   ├── checklists/
│       │   │   ├── checklist.tsx
│       │   │   ├── checklist-item.tsx
│       │   │   ├── progress-bar.tsx
│       │   │   └── checklists.api.ts
│       │   ├── labels/
│       │   │   ├── label-picker.tsx
│       │   │   ├── label-badge.tsx
│       │   │   ├── label-filter.tsx
│       │   │   └── labels.api.ts
│       │   ├── search/
│       │   │   ├── search-input.tsx
│       │   │   ├── filter-dropdown.tsx
│       │   │   └── active-filters.tsx
│       │   └── admin/
│       │       ├── admin-layout.tsx
│       │       ├── user-list.tsx
│       │       ├── user-actions.tsx
│       │       ├── registration-toggle.tsx
│       │       ├── activity-log.tsx
│       │       └── admin.api.ts
│       ├── hooks/
│       │   └── use-theme.ts
│       ├── lib/
│       │   ├── api.ts
│       │   ├── utils.ts
│       │   └── types.ts
│       └── layouts/
│           ├── app-layout.tsx
│           ├── sidebar.tsx
│           └── breadcrumbs.tsx
│
├── backend/                       # NestJS API
│   ├── package.json
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── .env.example
│   ├── .env
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── config/
│       │   └── configuration.ts
│       ├── common/
│       │   ├── decorators/
│       │   │   └── current-user.decorator.ts
│       │   ├── filters/
│       │   │   └── http-exception.filter.ts
│       │   ├── guards/
│       │   │   ├── auth.guard.ts
│       │   │   └── admin.guard.ts
│       │   ├── interceptors/
│       │   │   └── transform.interceptor.ts
│       │   └── pipes/
│       │       └── validation.pipe.ts
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── dto/
│       │   │   ├── login.dto.ts
│       │   │   └── register.dto.ts
│       │   └── guards/
│       │       └── session.guard.ts
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── entities/
│       │   │   └── user.entity.ts
│       │   └── dto/
│       │       └── create-user.dto.ts
│       ├── projects/
│       │   ├── projects.module.ts
│       │   ├── projects.controller.ts
│       │   ├── projects.service.ts
│       │   ├── entities/
│       │   │   └── project.entity.ts
│       │   └── dto/
│       │       ├── create-project.dto.ts
│       │       └── update-project.dto.ts
│       ├── boards/
│       │   ├── boards.module.ts
│       │   ├── boards.controller.ts
│       │   ├── boards.service.ts
│       │   ├── entities/
│       │   │   └── board.entity.ts
│       │   └── dto/
│       │       ├── create-board.dto.ts
│       │       ├── update-board.dto.ts
│       │       └── list-boards.dto.ts
│       ├── columns/
│       │   ├── columns.module.ts
│       │   ├── columns.controller.ts
│       │   ├── columns.service.ts
│       │   ├── entities/
│       │   │   └── column.entity.ts
│       │   └── dto/
│       │       ├── create-column.dto.ts
│       │       ├── update-column.dto.ts
│       │       └── move-cards.dto.ts
│       ├── cards/
│       │   ├── cards.module.ts
│       │   ├── cards.controller.ts
│       │   ├── cards.service.ts
│       │   ├── entities/
│       │   │   └── card.entity.ts
│       │   └── dto/
│       │       ├── create-card.dto.ts
│       │       ├── update-card.dto.ts
│       │       ├── move-card.dto.ts
│       │       └── list-cards.dto.ts
│       ├── checklists/
│       │   ├── checklists.module.ts
│       │   ├── checklists.controller.ts
│       │   ├── checklists.service.ts
│       │   ├── entities/
│       │   │   ├── checklist.entity.ts
│       │   │   └── checklist-item.entity.ts
│       │   └── dto/
│       │       ├── create-checklist.dto.ts
│       │       └── update-checklist-item.dto.ts
│       ├── labels/
│       │   ├── labels.module.ts
│       │   ├── labels.controller.ts
│       │   ├── labels.service.ts
│       │   ├── entities/
│       │   │   └── label.entity.ts
│       │   └── dto/
│       │       ├── create-label.dto.ts
│       │       └── assign-label.dto.ts
│       └── admin/
│           ├── admin.module.ts
│           ├── admin.controller.ts
│           ├── admin.service.ts
│           └── dto/
│               ├── block-user.dto.ts
│               └── activity-log.dto.ts
│
└── docs/                          # Project documentation
    └── architecture.md            # This document (generated)
```

### Architectural Boundaries

**API Boundaries:**
- All frontend → backend communication via REST API at `/api/*`
- Authentication boundary: `AuthGuard` protects all endpoints except `/api/auth/*`
- Admin boundary: `AdminGuard` protects `/api/admin/*` endpoints
- Public endpoints: `/api/auth/login`, `/api/auth/register` only

**Component Boundaries:**
- Features are self-contained — each feature owns its components, hooks, and API calls
- Shared UI components (`components/ui/`) are owned by shadcn/ui, never modified directly
- `lib/` contains only utilities and types — no business logic
- `layouts/` provides page structure — no data fetching

**Service Boundaries (Backend):**
- Each NestJS module is a bounded context (auth, users, projects, boards, columns, cards, checklists, labels, admin)
- Services contain business logic, never expose entities directly
- DTOs define API contracts — validation happens at the controller level
- Entities define database schema — TypeORM decorators handle mapping

**Data Boundaries:**
- User owns Projects → Projects own Boards → Boards own Columns → Columns own Cards
- Labels are shared across cards within a user's scope
- Checklists belong to Cards — cascade delete on card deletion
- Admin has read-only access to all user data for management

### Requirements to Structure Mapping

**FR Category → Backend Module → Frontend Feature:**

| FR Category | Backend Module | Frontend Feature |
|-------------|----------------|------------------|
| Auth (FR1-FR4) | `src/auth/` | `features/auth/` |
| Projects (FR5-FR9) | `src/projects/` | `features/projects/` |
| Boards (FR10-FR17) | `src/boards/` | `features/boards/` |
| Columns (FR18-FR22) | `src/columns/` | `features/columns/` |
| Cards (FR23-FR37) | `src/cards/` | `features/cards/` |
| Checklists (FR29-FR30) | `src/checklists/` | `features/checklists/` |
| Labels (FR27, FR35) | `src/labels/` | `features/labels/` |
| Search/Filter (FR34-FR37) | Card endpoint query params | `features/search/` |
| Admin (FR43-FR49) | `src/admin/` | `features/admin/` |

### Integration Points

**Internal Communication:**
- Frontend → Backend: REST API via Axios/fetch in `*.api.ts` files
- Backend modules: Injected via NestJS DI (e.g., `BoardsService` depends on `ColumnsService`)
- React Query: Manages server state, caching, and optimistic updates

**Data Flow:**
```
User Action → React Component → React Query Mutation → API Call → 
NestJS Controller → Service → TypeORM Entity → MySQL → 
Response → React Query Cache → UI Update
```

### File Organization Patterns

**Configuration Files:**
- Root: `.prettierrc`, `.gitignore`
- Frontend: `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `components.json`
- Backend: `nest-cli.json`, `tsconfig.json`, `.env`

**Test Organization:**
- Backend: Co-located `.spec.ts` files next to source
- Frontend: Co-located `.test.tsx` files next to components
- No separate test directories — keeps tests close to implementation

**Development Workflow:**
- Frontend dev server: `http://localhost:5173` (Vite)
- Backend dev server: `http://localhost:3000` (NestJS)
- API proxy: Vite proxies `/api/*` to backend during development

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- React/Vite + shadcn/ui + Tailwind CSS v4 — fully compatible
- NestJS + TypeORM + MySQL — fully compatible
- dnd-kit works natively with React — no conflicts
- React Query integrates with any fetch library — compatible with Axios
- Cookie-based sessions work seamlessly with NestJS guards
- Prettier config shared across both frontend and backend — no conflicts

**Pattern Consistency:**
- All naming conventions align with technology stack conventions
- Structure patterns support feature-based organization
- API response formats compatible with NestJS exception filters
- Authentication flow aligns with cookie-based session decision

**Structure Alignment:**
- Monorepo structure supports independent frontend/backend development
- Feature-based frontend organization maps to NestJS module architecture
- Co-located tests align with both Vite and NestJS conventions
- Configuration files organized per established patterns

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| FR Category | Backend Module | Frontend Feature | Coverage |
|-------------|----------------|------------------|----------|
| Auth (FR1-FR4) | `src/auth/` | `features/auth/` | ✅ Complete |
| Projects (FR5-FR9) | `src/projects/` | `features/projects/` | ✅ Complete |
| Boards (FR10-FR17) | `src/boards/` | `features/boards/` | ✅ Complete |
| Columns (FR18-FR22) | `src/columns/` | `features/columns/` | ✅ Complete |
| Cards (FR23-FR37) | `src/cards/` | `features/cards/` | ✅ Complete |
| Checklists (FR29-FR30) | `src/checklists/` | `features/checklists/` | ✅ Complete |
| Labels (FR27, FR35) | `src/labels/` | `features/labels/` | ✅ Complete |
| Search/Filter (FR34-FR37) | Card endpoint query params | `features/search/` | ✅ Complete |
| Admin (FR43-FR49) | `src/admin/` | `features/admin/` | ✅ Complete |

**Non-Functional Requirements Coverage:**

| NFR | Architectural Support | Status |
|-----|----------------------|--------|
| Performance (NFR1-NFR5) | Vite HMR, React Query caching, optimistic updates, indexed DB queries | ✅ Addressed |
| Security (NFR6-NFR10) | bcrypt, httpOnly cookies, CSRF tokens, DOMPurify, `@nestjs/throttler` | ✅ Addressed |
| Reliability (NFR11-NFR14) | TypeORM transactions, global exception filter, error toast notifications | ✅ Addressed |
| Accessibility (NFR15-NFR17) | Radix UI primitives, keyboard navigation, ARIA labels, focus management | ✅ Addressed |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- ✅ All critical decisions documented with rationale
- ✅ Technology versions verified and documented
- ✅ Implementation patterns comprehensive
- ✅ Examples provided for all major patterns

**Structure Completeness:**
- ✅ Complete directory tree defined with all files
- ✅ All component boundaries established
- ✅ Integration points clearly specified
- ✅ Requirements mapped to specific locations

**Pattern Completeness:**
- ✅ All potential conflict points addressed (naming, structure, format, process)
- ✅ Naming conventions comprehensive across all layers
- ✅ Communication patterns fully specified
- ✅ Process patterns documented (error handling, loading states, auth flow)

### Gap Analysis Results

**Critical Gaps:** None — architecture supports all implementation needs

**Important Gaps:**
- cPanel deployment configuration — defer to implementation phase, document during deploy setup
- Database migration strategy details — TypeORM auto-generates from entities, manual review during implementation

**Nice-to-Have Gaps:**
- Database schema ERD diagram — TypeORM entities serve as implicit schema documentation
- API endpoint list — Swagger will auto-generate during implementation

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Low — single-user focused)
- [x] Technical constraints identified (cPanel, MySQL, self-hosted)
- [x] Cross-cutting concerns mapped (auth, CRUD, drag-drop, dark mode, accessibility)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions (TypeORM, cookie sessions, Swagger)
- [x] Technology stack fully specified (React/Vite + NestJS + MySQL)
- [x] Integration patterns defined (REST API, React Query, NestJS DI)
- [x] Performance considerations addressed (caching, optimistic updates, indexing)

**✅ Implementation Patterns**
- [x] Naming conventions established (DB, API, code)
- [x] Structure patterns defined (feature-based, module-based)
- [x] Communication patterns specified (REST, JSON responses)
- [x] Process patterns documented (error handling, loading states, auth flow, code formatting)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH — all decisions are coherent, all requirements are covered, all patterns are defined

**Key Strengths:**
- Clear tech stack with official tooling — no vendor lock-in
- Feature-based organization maps cleanly to requirements
- Comprehensive naming and formatting patterns prevent agent conflicts
- Security baked in from the start (bcrypt, httpOnly cookies, CSRF, XSS)

**Areas for Future Enhancement:**
- WebSocket real-time updates (post-MVP growth feature)
- CI/CD pipeline (defer to when deployment frequency increases)
- Caching layer (defer to when scale requires it)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented in this document
- Use implementation patterns consistently across all components
- Respect project structure and boundaries defined above
- Refer to this document for all architectural questions

**First Implementation Priority:**
```bash
# Frontend initialization
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npx shadcn@latest init -t vite

# Backend initialization
npx @nestjs/cli new backend --package-manager npm
```

## Database Migration Strategy & Workflow

### Overview

TypeORM provides two approaches for schema management:
- **Synchronize (dev only):** Auto-sync schema from entities — fast for development, unsafe for production
- **Migrations (production):** Versioned SQL scripts that track every schema change — safe, reversible, auditable

**Rule:** `synchronize: false` ALWAYS — no exceptions. Every schema change goes through migrations. Local development and production use the identical migration workflow.

---

### Configuration

**`backend/src/data-source.ts`** — TypeORM CLI datasource config:

```typescript
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: false,  // Always explicit
  synchronize: false,   // ALWAYS false
});
```

**`backend/src/app.module.ts`** — NestJS TypeORM config:

```typescript
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'mysql',
    host: config.get('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    username: config.get('DB_USERNAME'),
    password: config.get('DB_PASSWORD'),
    database: config.get('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false,
    synchronize: false,  // NEVER true — migrations only
  }),
}),
```

**`.env` configuration:**

```env
# Development
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=trello_clone_dev

# Production
NODE_ENV=production
DB_HOST=your-cpanel-db-host
DB_PORT=3306
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=trello_clone_prod
```

---

### Package Scripts

Add to `backend/package.json`:

```json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm migration:generate -- -d src/data-source.ts",
    "migration:create": "npm run typeorm migration:create",
    "migration:run": "npm run typeorm migration:run -- -d src/data-source.ts",
    "migration:revert": "npm run typeorm migration:revert -- -d src/data-source.ts",
    "migration:show": "npm run typeorm migration:show -- -d src/data-source.ts",
    "db:sync": "npm run migration:run"
  }
}
```

---

### Migration Naming Convention

```
{timestamp}-{action}-{table}-{description}.ts
```

**Examples:**
- `1710825600000-CreateUsersTable.ts`
- `1710825600001-CreateProjectsTable.ts`
- `1710825600002-AddDueDateToCards.ts`
- `1710825600003-RenameCardTitleToName.ts`
- `1710825600004-AddIndexOnCardsColumnId.ts`

**Actions:**
- `Create` — new table
- `Add` — new column/index
- `Remove` — drop column/index
- `Rename` — rename column/table
- `Alter` — modify column type/constraints
- `Seed` — data migration

---

### Local Development Workflow (Same as Production)

**Golden Rule:** If it doesn't work locally with migrations, it won't work in production.

#### Schema Change Workflow:

```bash
# 1. Modify or create entity file
# 2. Generate migration
npm run migration:generate -- src/migrations/1710825600000-CreateLabelsTable

# 3. Review generated migration
cat src/migrations/1710825600000-CreateLabelsTable.ts

# 4. Run migration
npm run migration:run

# 5. Verify
npm run migration:show

# 6. Commit entity + migration together
git add src/labels/entities/label.entity.ts
git add src/migrations/1710825600000-CreateLabelsTable.ts
git commit -m "feat(db): add labels table with migration"
```

#### Fresh Database Setup:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE trello_clone_dev;"

# Run all migrations from scratch
npm run migration:run

# Verify all applied
npm run migration:show
```

#### Daily Development:

```bash
# After pulling changes with new migrations
npm run migration:run

# Before starting work
npm run migration:show  # Verify you're up to date
```

---

### Data Migration Example

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultLabels1710825600009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const defaultLabels = [
      { name: 'Urgent', color: 'red' },
      { name: 'Important', color: 'orange' },
      { name: 'Low Priority', color: 'green' },
    ];

    for (const label of defaultLabels) {
      await queryRunner.query(
        `INSERT INTO labels (name, color, created_at) VALUES (?, ?, NOW())`,
        [label.name, label.color],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM labels WHERE name IN ('Urgent', 'Important', 'Low Priority')`,
    );
  }
}
```

---

### Production Deployment Workflow

#### Pre-Deployment Checklist

- [ ] All migrations tested locally
- [ ] `npm run migration:show` shows all migrations applied locally
- [ ] Database backup taken before deployment
- [ ] Migration files included in deployment package

#### Deployment Script (`backend/scripts/deploy.sh`):

```bash
#!/bin/bash
set -e

echo "=== KanbanFlow Deployment ==="

# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Build TypeScript (required for migrations)
npm run build

# Run pending migrations (same command as local)
npm run migration:run

# Verify all migrations applied
npm run migration:show

# Start application
pm2 restart kanbanflow-api

echo "=== Deployment Complete ==="
```

---

### Reverting Migrations

```bash
# Revert last migration
npm run migration:revert

# Revert multiple (run multiple times)
npm run migration:revert
npm run migration:revert

# Check current state
npm run migration:show
```

**⚠️ Warning:** Only revert migrations that haven't been deployed to production. Once in production, use forward-only migrations.

---

### Troubleshooting

**Migration won't generate:**
```bash
# Ensure entities are compiled
npm run build

# Check data-source.ts path
npm run typeorm migration:generate -- -d src/data-source.ts src/migrations/MyMigration
```

**Migration fails to run:**
```bash
# Check pending migrations
npm run migration:show

# Check database connection
npm run typeorm schema:log -- -d src/data-source.ts

# Revert and retry
npm run migration:revert
```

**Schema out of sync:**
```bash
# Show what's different
npm run typeorm schema:log -- -d src/data-source.ts

# Generate migration to sync
npm run migration:generate -- src/migrations/1710825600000-SyncSchema
```

---

### Migration File Structure

```
backend/
├── src/
│   ├── data-source.ts           # TypeORM CLI config
│   ├── migrations/
│   │   ├── 1710825600000-CreateUsersTable.ts
│   │   ├── 1710825600001-CreateProjectsTable.ts
│   │   ├── 1710825600002-CreateBoardsTable.ts
│   │   ├── 1710825600003-CreateColumnsTable.ts
│   │   ├── 1710825600004-CreateCardsTable.ts
│   │   ├── 1710825600005-CreateChecklistsTable.ts
│   │   ├── 1710825600006-CreateLabelsTable.ts
│   │   ├── 1710825600007-CreateCardLabelsTable.ts
│   │   ├── 1710825600008-CreateActivityLogTable.ts
│   │   └── 1710825600009-SeedDefaultData.ts
│   └── ...
└── scripts/
    └── deploy.sh                # Deployment script
```

---

### Non-Negotiable Migration Rules

1. **`synchronize: false` ALWAYS** — No exceptions. Never enable auto-sync in any environment.

2. **Every entity change = new migration** — If you modify an entity, you MUST generate and commit a migration.

3. **Migrations run explicitly** — Always use `npm run migration:run`. Never auto-run on app start.

4. **Test locally before commit** — Run `npm run migration:run` locally. If it fails, fix before committing.

5. **Review before running** — Always read the generated migration SQL before running it.

6. **Never modify applied migrations** — If a migration has been applied (locally or in prod), create a new migration to fix issues.

7. **Backup before production migrations** — Always backup the database before running migrations in production.

8. **Commit entity + migration together** — Never commit an entity change without its corresponding migration.

---

### Git Workflow for Migrations

**Commit convention:**
```
feat(db): add labels table migration
fix(db): add missing index on cards.column_id
chore(db): seed default label data
```

**Branch strategy:**
- Generate migrations in feature branches
- Never rebase branches with migrations
- Merge migrations in chronological order
- Resolve migration conflicts by regenerating

**PR checklist for schema changes:**
- [ ] Migration file included
- [ ] Migration tested locally
- [ ] `up` and `down` methods verified
- [ ] No data loss in `down` method
- [ ] Migration named following convention
- [ ] Entity + migration committed together
