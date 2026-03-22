# Story 1.7: Project CRUD

Status: ready-for-dev

## Story

As a user,
I want to create, view, edit, and delete projects,
so that I can organize my boards into logical groups.

## Acceptance Criteria

1. **Given** I am on the projects page, **When** I click "Create Project", **Then** an inline form appears for project name, **And** submitting creates the project and adds it to my list
2. **Given** I have projects, **When** I view the projects page, **Then** I see all my projects listed with names, **And** each project shows its board count (initially 0)
3. **Given** I want to rename a project, **When** I click edit on a project, **Then** I can modify the name inline, **And** changes are saved on Enter or blur, **And** pressing Escape cancels the edit
4. **Given** I want to delete a project, **When** I click delete and confirm, **Then** the project and all its boards are deleted (cascade), **And** a success toast appears with undo option (5 seconds)
5. **Given** I have no projects, **When** I view the projects page, **Then** I see an empty state with illustration, "Start organizing" headline, and "Create your first project" CTA
6. **Given** I create or delete a project, **When** the action completes, **Then** the sidebar project list updates immediately

## Tasks / Subtasks

- [ ] Task 1: Create backend ProjectsModule (AC: 1, 2, 3, 4)
  - [ ] Create `backend/src/projects/projects.module.ts` — import TypeOrmModule.forFeature([Project]), declare controller + service, export service
  - [ ] Register ProjectsModule in `backend/src/app.module.ts` imports

- [ ] Task 2: Create backend ProjectsService (AC: 1, 2, 3, 4)
  - [ ] Create `backend/src/projects/projects.service.ts`
  - [ ] `findAllByUserId(userId: number)` — returns projects with board count via left join or relation
  - [ ] `create(userId: number, dto: CreateProjectDto)` — creates project owned by user
  - [ ] `update(id: number, userId: number, dto: UpdateProjectDto)` — updates name, verify ownership
  - [ ] `remove(id: number, userId: number)` — deletes project (cascade handled by DB FK), verify ownership
  - [ ] `findOne(id: number, userId: number)` — returns single project or throws NotFoundException
  - [ ] All methods verify `user_id` ownership before mutation — prevents unauthorized access
  - [ ] Create `backend/src/projects/projects.service.spec.ts` — unit tests

- [ ] Task 3: Create backend DTOs (AC: 1, 3)
  - [ ] Create `backend/src/projects/dto/create-project.dto.ts` — `name: string` with `@IsString()`, `@IsNotEmpty()`, `@MaxLength(255)`
  - [ ] Create `backend/src/projects/dto/update-project.dto.ts` — `name?: string` with same validators, `PartialType(CreateProjectDto)` from swagger

- [ ] Task 4: Create backend ProjectsController (AC: 1, 2, 3, 4)
  - [ ] Create `backend/src/projects/projects.controller.ts`
  - [ ] `@Controller('api/projects')`, `@UseGuards(SessionGuard)`, `@ApiTags('projects')`
  - [ ] `GET /` — list user's projects with board count
  - [ ] `POST /` — create project, return 201
  - [ ] `PATCH /:id` — update project name
  - [ ] `DELETE /:id` — delete project with cascade
  - [ ] Extract userId from `@Session()`, pass to service methods
  - [ ] Swagger decorators on all endpoints
  - [ ] Create `backend/src/projects/projects.controller.spec.ts` — unit tests

- [ ] Task 5: Create frontend API client (AC: 1, 2, 3, 4)
  - [ ] Create `frontend/src/features/projects/projects.api.ts`
  - [ ] Follow exact pattern from `features/auth/auth.api.ts` — raw fetch(), ApiResponse type
  - [ ] `fetchProjects()` — GET `/api/projects`
  - [ ] `createProject(name)` — POST `/api/projects`
  - [ ] `updateProject(id, name)` — PATCH `/api/projects/:id`
  - [ ] `deleteProject(id)` — DELETE `/api/projects/:id`
  - [ ] Inline types: `Project { id: number; name: string; boardCount: number; created_at: string; updated_at: string }`

- [ ] Task 6: Create frontend React Query hooks (AC: 1, 2, 3, 4)
  - [ ] Create `frontend/src/features/projects/use-projects.ts`
  - [ ] `useProjects()` — useQuery with key `['projects']`, calls fetchProjects
  - [ ] `useCreateProject()` — useMutation, invalidates `['projects']` on success
  - [ ] `useUpdateProject()` — useMutation, optimistic update on `['projects']` cache
  - [ ] `useDeleteProject()` — useMutation, invalidates `['projects']` on success
  - [ ] Follow patterns from `features/auth/auth-provider.tsx` (useQuery/useMutation)

- [ ] Task 7: Create ProjectsPage component (AC: 1, 2, 3, 5)
  - [ ] Create `frontend/src/features/projects/project-list.tsx`
  - [ ] Page title "My Projects"
  - [ ] "Create Project" button at top — opens inline form
  - [ ] Inline form: Input field + Save/Cancel buttons, focused on mount
  - [ ] Project cards showing: name (editable inline), board count, edit/delete actions
  - [ ] Inline edit: click name to edit, save on Enter/blur, cancel on Escape
  - [ ] Empty state: illustration + "Start organizing" + "Create your first project" CTA button (UX-DR10)
  - [ ] Loading state: skeleton cards while fetching
  - [ ] Use shadcn/ui Button, Input components
  - [ ] Use CSS variables for theming (dark mode support)
  - [ ] Create `frontend/src/features/projects/project-list.test.tsx`

- [ ] Task 8: Implement delete with confirmation and toast (AC: 4)
  - [ ] Delete button on each project card
  - [ ] shadcn/ui Dialog confirmation: "Delete project '{name}'? This will delete all boards and cards within it."
  - [ ] On confirm: call deleteProject mutation
  - [ ] On success: show toast with "Project deleted" + "Undo" button (5s timer)
  - [ ] Undo: re-create project with same name (acceptable MVP approach, or restore from cache)
  - [ ] Use existing `useToast()` from `components/ui/use-toast.tsx`

- [ ] Task 9: Wire sidebar to show projects (AC: 6)
  - [ ] Update `frontend/src/layouts/app-layout.tsx`:
    - Import and call `useProjects()` hook
    - Pass `projects` array (mapped to `{ id: string; name: string }`) to `<Sidebar>`
    - Pass `activeProjectId={projectId}` to `<Sidebar>`
    - Pass `onProjectClick` that navigates to `/projects/:id`
  - [ ] Sidebar already accepts these props — just needs data wired in

- [ ] Task 10: Update App.tsx routing (AC: 1, 2)
  - [ ] Import `ProjectList` from `features/projects/project-list`
  - [ ] Replace placeholder `ProjectsPage` with `<ProjectList />` on `/` route
  - [ ] Keep `/projects/:projectId` route for future board view (still placeholder)
  - [ ] Remove inline `ProjectsPage` placeholder component

## Dev Notes

### Previous Story Intelligence

**From Story 1.6 (App Shell & Navigation):**
- AppLayout provides header, sidebar (240px expanded, collapsed by default), breadcrumbs, content area via `<Outlet />`
- Sidebar accepts `projects?: Array<{ id: string; name: string }>`, `activeProjectId?: string`, `onProjectClick?: (projectId: string) => void` — but NOT wired yet
- Breadcrumbs show project name from route params
- Routes: `/` (projects list), `/projects/:projectId` (future), `/projects/:projectId/boards/:boardId` (future)
- 44 frontend tests pass — new tests must not break them
- Fixed localStorage sidebar collapse bug: `stored === 'false'` check for default-collapsed behavior

[Source: 1-6-app-shell-navigation.md]

**From Story 1.5 (Design System Foundation):**
- CSS variables define Soft Teal palette with light/dark tokens
- `use-theme` hook at `frontend/src/hooks/use-theme.ts`
- Tailwind v4 via `@tailwindcss/vite` plugin
- shadcn/ui components available: Button, Input, Dialog, Badge, DropdownMenu, Toast

[Source: 1-5-design-system-foundation.md]

**From Story 1.4 (User Login/Logout):**
- Auth API pattern: raw `fetch()` in `features/auth/auth.api.ts` with inline types
- Auth context via `AuthProvider` + `useAuth()` hook
- Session-based auth: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `SessionGuard` protects endpoints — checks `session.userId`

[Source: 1-4-user-login-logout.md]

**From Story 1.2 (Database Schema Setup):**
- `projects` table: `id` (auto-increment PK), `name` (varchar 255), `user_id` (FK to users, CASCADE delete), `created_at`, `updated_at`
- TypeORM `synchronize: false` — migrations only
- `Project` entity exists at `backend/src/projects/entities/project.entity.ts` with `@ManyToOne(() => User, { onDelete: 'CASCADE' })`

[Source: 1-2-database-schema-setup.md]

### Architecture Compliance

**Backend Organization (from architecture.md):**
- Module-based: `src/projects/` is a bounded context
- Controller handles HTTP, Service contains business logic, Entity defines schema
- DTOs define API contracts — validation at controller level via ValidationPipe
- `SessionGuard` for auth protection (currently at `src/auth/guards/session.guard.ts`)
- RESTful `kebab-case` endpoints: `/api/projects`
- Swagger decorators on all endpoints
- NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, etc.

[Source: architecture.md#Backend Organization]

**Backend Module Structure (must create):**
```
backend/src/projects/
├── projects.module.ts
├── projects.controller.ts
├── projects.controller.spec.ts
├── projects.service.ts
├── projects.service.spec.ts
├── entities/
│   └── project.entity.ts          # EXISTS
└── dto/
    ├── create-project.dto.ts
    └── update-project.dto.ts
```

[Source: architecture.md#Complete Project Directory Structure]

**Frontend Organization (from architecture.md):**
- Feature-based folders under `src/features/`
- Each feature owns components, hooks, API calls
- `features/projects/` must contain: `project-list.tsx`, `use-projects.ts`, `projects.api.ts`
- Shared UI from `components/ui/` — never modify directly
- Co-located tests: `.test.tsx` next to components

[Source: architecture.md#Frontend Organization]

**Frontend Files (must create):**
```
frontend/src/features/projects/
├── project-list.tsx               # Main page component
├── project-list.test.tsx          # Tests
├── use-projects.ts                # React Query hooks
└── projects.api.ts                # API client
```

**Files to modify:**
```
frontend/src/App.tsx               # Replace placeholder, add import
frontend/src/layouts/app-layout.tsx # Wire projects data to sidebar
```

[Source: architecture.md#Complete Project Directory Structure]

**API Response Format (from architecture.md):**
```typescript
// Success response
{ data: T, message?: string }

// List response
{ data: T[], total: number }

// Error response
{ statusCode: number, message: string | string[], error: string }
```

[Source: architecture.md#API Response Formats]

**Naming Conventions (from architecture.md):**
- DB tables: `snake_case` plural (`projects`)
- DB columns: `snake_case` (`created_at`, `user_id`)
- API endpoints: RESTful `kebab-case` (`/api/projects`)
- Backend files: `kebab-case` (`projects.controller.ts`)
- Frontend files: `kebab-case` (`project-list.tsx`)
- Components: `PascalCase` (`ProjectList`)

[Source: architecture.md#Naming Patterns]

### UX Requirements

**From UX Design Specification:**

**Project List (UX-DR10, UX-DR17):**
- Empty state: illustration + "Start organizing" + "Create your first project" CTA
- Project cards with name, board count
- Inline edit on click, save on Enter/blur, cancel on Escape

**Toast Notifications (UX-DR17):**
- Success toasts: green, auto-dismiss 3s, bottom-right
- Destructive actions: "Undo" button, 5s auto-dismiss
- Error toasts: red, manual dismiss
- Use existing `useToast()` hook

**Form Patterns:**
- Inline: card creation, quick edits — no modal, edit in place
- Confirmation dialog only for destructive actions (delete)

**Button Hierarchy:**
- Primary: "Create Project" CTA
- Ghost: Edit, Cancel
- Destructive: Delete

**Loading States:**
- Skeleton screens for initial load
- Spinner on buttons for form submissions

[Source: ux-design-specification.md#UX Consistency Patterns, #Empty States, #Loading States]

### File Structure Requirements

**New backend files:**
```
backend/src/projects/
├── projects.module.ts
├── projects.controller.ts
├── projects.controller.spec.ts
├── projects.service.ts
├── projects.service.spec.ts
├── dto/
│   ├── create-project.dto.ts
│   └── update-project.dto.ts
```

**Existing backend files (reference only, DO NOT MODIFY):**
```
backend/src/projects/entities/project.entity.ts  # EXISTS
backend/src/auth/guards/session.guard.ts          # EXISTS
backend/src/users/users.service.ts                # Reference for patterns
```

**New frontend files:**
```
frontend/src/features/projects/
├── project-list.tsx
├── project-list.test.tsx
├── use-projects.ts
└── projects.api.ts
```

**Files to modify:**
```
backend/src/app.module.ts                          # Add ProjectsModule
frontend/src/App.tsx                               # Replace placeholder
frontend/src/layouts/app-layout.tsx                # Wire sidebar data
```

### Testing Requirements

**Backend:**
- Framework: Jest (NestJS default), co-located `.spec.ts` files
- Unit tests: service methods with mocked repository
- Unit tests: controller with mocked service
- Test ownership verification (user can only access own projects)
- Test cascade delete behavior

**Frontend:**
- Framework: Vitest + React Testing Library, co-located `.test.tsx` files
- Test: renders project list
- Test: create project inline form
- Test: edit project name inline
- Test: delete project with confirmation
- Test: empty state display
- Test: loading state display
- Mock API calls with vi.fn()
- 44 existing frontend tests must continue to pass

[Source: project-context.md#Testing Rules]

### Critical Anti-Patterns

- ❌ NEVER use `any` type — strict TypeScript
- ❌ NEVER return raw database errors to frontend
- ❌ NEVER modify shadcn/ui components directly
- ❌ NEVER use hardcoded color values — use CSS variables / Tailwind tokens
- ❌ NEVER fetch data in layout components — AppLayout should only receive data, not fetch
- ❌ NEVER mix `snake_case` and `camelCase` in the same layer
- ❌ NEVER override Prettier formatting — shared config at root
- ❌ NEVER use `synchronize: true` in TypeORM
- ❌ NEVER skip ownership verification on mutations
- ❌ NEVER create custom Button/Input when shadcn equivalents exist

[Source: project-context.md#Critical Don't-Miss Rules]

### Performance Considerations

- React Query caching: projects list cached with staleTime 5min
- Optimistic updates for rename — feels instant
- No skeleton needed for sidebar (data loads with page)
- Cascade delete handled by database FK — no manual cleanup needed

[Source: architecture.md#Performance Requirements]

### Accessibility

- Inline form: Input focused on mount, Escape to cancel
- Edit mode: input has aria-label "Project name"
- Delete button: aria-label "Delete project {name}"
- Confirmation dialog: focus trapped, Escape to dismiss
- Empty state CTA: keyboard accessible button

[Source: ux-design-specification.md#Accessibility Strategy]

### References

- [Source: epics.md#Story 1.7] — User story and acceptance criteria
- [Source: prd.md#Project Management] — FR5-FR8 functional requirements
- [Source: architecture.md#Backend Organization] — Module structure patterns
- [Source: architecture.md#Frontend Organization] — Feature-based structure
- [Source: architecture.md#API Response Formats] — Response contract
- [Source: architecture.md#Naming Patterns] — Naming conventions
- [Source: ux-design-specification.md#Empty States] — Empty state design
- [Source: ux-design-specification.md#UX Consistency Patterns] — Toast, button, form patterns
- [Source: project-context.md#Framework-Specific Rules] — React + NestJS rules
- [Source: project-context.md#Critical Don't-Miss Rules] — Anti-patterns
- [Source: 1-6-app-shell-navigation.md] — Sidebar interface, routing setup
- [Source: 1-4-user-login-logout.md] — Auth patterns, API client pattern

## Dev Agent Record

### Agent Model Used


### Debug Log References

### Completion Notes List

### File List
