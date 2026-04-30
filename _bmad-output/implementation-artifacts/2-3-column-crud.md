# Story 2.3: Column CRUD

Status: ready-for-dev

## Story

As a user,
I want to create, edit, and delete columns within a board,
so that I can customize my workflow stages.

## Acceptance Criteria

1. **Given** I am viewing a board, **When** I click "Add Column", **Then** a new column appears at the right end of the board, **And** the column has an editable name field focused
2. **Given** I want to rename a column, **When** I click the column header title, **Then** the name becomes editable inline, **And** changes are saved on Enter or blur
3. **Given** I want to delete a column, **When** I click the column menu and select "Delete", **Then** a confirmation dialog appears, **And** confirming deletes the column and all its cards (cascade), **And** a toast confirms the deletion

## Tasks / Subtasks

- [ ] Task 1: Database migration — add columns table (AC: #1, #2, #3)
  - [ ] Subtask 1.1: Create Column entity (id, name, board_id FK, created_at, updated_at)
  - [ ] Subtask 1.2: Update Card entity — add column_id FK with cascade delete
  - [ ] Subtask 1.3: Generate and run migration for columns and cards tables
- [ ] Task 2: Backend API endpoints (AC: #1, #2, #3)
  - [ ] Subtask 2.1: POST /api/boards/:boardId/columns — create column
  - [ ] Subtask 2.2: PATCH /api/columns/:id — update column name
  - [ ] Subtask 2.3: DELETE /api/columns/:id — delete column (cascade to cards)
  - [ ] Subtask 2.4: GET /api/boards/:boardId/columns — list columns
- [ ] Task 3: Frontend Column component (AC: #1, #2, #3)
  - [ ] Subtask 3.1: Create `features/columns/column.tsx` — column container with header, card list, add card button
  - [ ] Subtask 3.2: Create `features/columns/column-header.tsx` — inline editable title with menu
  - [ ] Subtask 3.3: Create `features/columns/column-card-list.tsx` — scrollable card list (placeholder: render "+ Add a card" inline input stub, cards injected in Epic 3)
  - [ ] Subtask 3.3.1: Define `Card` interface with `{ id, title }` minimal shape — contract set now for Epic 3 injection
  - [ ] Subtask 3.3.2: Props: `cards: Card[]` and `columnId: number`
  - [ ] Subtask 3.3.3: Render empty placeholder state until cards are implemented
  - [ ] Subtask 3.4: Create `features/columns/add-column-button.tsx` — "Add Column" at right edge
  - [ ] Subtask 3.5: Integrate column header inline edit (click title → editable → Enter/blur save)
  - [ ] Subtask 3.6: Add column menu with Delete option and confirmation dialog
- [ ] Task 4: Frontend API integration (AC: all)
  - [ ] Subtask 4.1: Create `features/columns/columns.api.ts` — API functions for CRUD
  - [ ] Subtask 4.2: Create `features/columns/use-columns.ts` — React Query hooks
  - [ ] Subtask 4.3: Integrate columns into board view alongside cards
- [ ] Task 5: Tests (AC: all)
  - [ ] Subtask 5.1: Backend unit tests for column CRUD operations
  - [ ] Subtask 5.2: Frontend tests for column component

## Dev Notes

### Database Schema

**Column entity** (`backend/src/columns/entities/column.entity.ts`):
```
Column {
  id: number (PK, auto-increment)
  name: string (NOT NULL, default "New Column")
  position: number (NOT NULL, default 0) — order within board, added now to support Story 2.4 (sorting)
  board_id: number (FK to boards.id, NOT NULL)
  created_at: Date
  updated_at: Date
}
```

**Card entity update** — add `column_id` FK:
```
Card {
  ... (existing fields from Story 2.2)
  column_id: number (FK to columns.id, NOT NULL) — required once cards are built
}
```

**Constraints:**
- Column → Board: `ON DELETE CASCADE` — deleting a board deletes all its columns
- Card → Column: `ON DELETE CASCADE` — deleting a column deletes all its cards
- Index: `idx_columns_board_id` on `columns.board_id`
- Index: `idx_cards_column_id` on `cards.column_id`
- Unique constraint: `(board_id, position)` — no two columns in same board share same position

### API Endpoints

**New endpoints for Story 2.3:**
```
POST   /api/boards/:boardId/columns         — Create column
GET    /api/boards/:boardId/columns         — List columns for a board (includes empty cards arrays)
PATCH  /api/columns/:id                      — Update column (name)
DELETE /api/columns/:id                      — Delete column (cascade cards)
```

**Request/Response examples:**

```typescript
// POST /api/boards/:boardId/columns (201)
Request:  { name: "In Review" }  // position auto-calculated from board's existing columns
Response: { data: { id: 1, name: "In Review", position: 3, board_id: 1, cards: [], created_at: "...", updated_at: "..." }, message: "Column created" }

// GET /api/boards/:boardId/columns (200)
Response: {
  data: Column[]  // Array sorted by position ASC (future-proof for Story 2.4 sorting)
}  // Each column includes cards: [] (empty arrays — cards not implemented yet)

// PATCH /api/columns/:id (200)
Request:  { name: "Code Review" }
Response: { data: { id: 1, name: "Code Review", ... }, message: "Column updated" }

// DELETE /api/columns/:id (200)
Response: { message: "Column deleted" }
```

### Previous Story Intelligence

**From Story 2.2 (Board Archiving):**
- Board entity: `id, name, background_color, user_id, project_id, is_archived, created_at, updated_at`
- Board archiving complete — `is_archived` field added to boards
- Authorization pattern: all board operations verify `board.user_id === session.userId`
- API response format: `{ data: T, message?: string }`
- Toast system: undo toasts for destructive actions, 5 seconds, success/error variants

**From Story 2.1 (Board CRUD):**
- Board CRUD module established at `backend/src/boards/`
- Frontend feature at `frontend/src/features/boards/`
- Uses shadcn/ui components (never modify them)
- ESLint, Prettier, TypeScript strict mode enforced

### Architecture Compliance

**Naming conventions:**
- DB: `snake_case` (e.g., `board_id`, `created_at`)
- API: `kebab-case` endpoints (e.g., `/api/boards/:id/columns`)
- Code: `camelCase` for fields/properties, `PascalCase` for types/components
- Files: `kebab-case` (e.g., `column.entity.ts`, `column-header.tsx`)

**Module structure:**
```
backend/src/columns/
├── columns.module.ts
├── columns.controller.ts
├── columns.service.ts
├── columns.service.spec.ts
├── columns.controller.spec.ts
├── entities/
│   └── column.entity.ts
└── dto/
    ├── create-column.dto.ts    // { name: string } — position auto-set server-side
    └── update-column.dto.ts    // { name: string }
```

```
frontend/src/features/columns/
├── column.tsx
├── column-header.tsx
├── column-card-list.tsx    // Props: { cards: Card[], columnId: number }
├── add-column-button.tsx
├── columns.api.ts
├── use-columns.ts
└── column.test.tsx
// Shared interface (add to frontend/src/lib/types.ts or columns/types.ts):
// interface Card { id: number; title: string }
```

### Critical Anti-Patterns

- ❌ NEVER allow column deletion without confirmation dialog
- ❌ NEVER skip cascade delete on columns — must delete all cards in column
- ❌ NEVER create column without board ownership verification
- ❌ NEVER use soft-delete on columns — real cascade delete only
- ❌ NEVER allow duplicate column names without warning (user may want duplicate — just don't enforce uniqueness)
- ❌ NEVER forget to verify board ownership before creating columns
- ❌ NEVER use `any` type — always define proper TypeScript interfaces

### UX Requirements (UX-DR5)

**Column component anatomy:**
- Header: editable title (click to edit inline) + card count + three-dot menu
- Card list: scrollable area for cards (cards will be implemented in Epic 3)
- Footer: "+ Add a card" button (placeholder inline input — creates card in Epic 3)

**Add Column placement:** Column appears at the rightmost position (max position + 1), visually sorted to the end of the board.

**Column layout:**
- Minimum width: 320px
- Gap between columns: 24px
- Horizontal scroll on board (handled in Story 2.5)
- Column header shows: name + card count badge + menu (three dots)

**Inline edit behavior:**
- Click title → becomes `<input>` with current text selected
- Enter → save and exit edit mode
- Blur → save and exit edit mode
- Escape → cancel edit, revert to original name
- Empty name → revert to "New Column" or previous name

**Column menu items:**
- "Rename" (inline, same as clicking title)
- "Delete" — opens confirmation dialog

**Confirmation dialog (Delete):**
- Headline: "Delete column?"
- Description: "All cards in this column will be permanently deleted."
- Destructive button: "Delete" (rose/red)
- Cancel button: "Cancel" (ghost/secondary)

**Toast on delete:**
- Message: "Column deleted"
- No undo (cascade delete is irreversible — no undo option)

### Testing Standards

**Backend (Jest):**
- Test: create column → verifies board ownership and default name
- Test: update column name → verifies inline rename
- Test: delete column → verifies cascade delete of cards
- Test: authorization → verify user cannot modify another user's columns
- Test: error handling → 404 on invalid column/board

**Frontend (Vitest + React Testing Library):**
- Test: inline edit saves on Enter
- Test: inline edit saves on blur
- Test: inline edit reverts on Escape
- Test: delete opens confirmation dialog
- Test: confirm delete removes column from list

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3-Column-CRUD]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Response-Format]
- [Source: _bmad-output/planning-artifacts/architecture.md#Database-Migration-Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Column]
- [Source: _bmad-output/implementation-artifacts/2-2-board-archiving.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List