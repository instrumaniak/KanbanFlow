# Story 3.5: Card Deletion

Status: ready-for-dev

---

## Story

**Epic 3: Task Capture & Card Management**

As a user,
I want to delete cards I no longer need,
So that my board stays clean and focused.

## Acceptance Criteria

1. **Given** I am viewing a card, **When** I click the card menu and select "Delete", **Then** a confirmation dialog appears, **And** confirming deletes the card permanently, **And** a toast notification appears with "Undo" button (5 seconds)

2. **Given** I click Undo on the delete toast, **When** within 5 seconds, **Then** the card is restored to its original position

---

## Tasks / Subtasks

- [ ] Task 1: Update card.tsx - Add dropdown menu with Delete option (AC: #1)
  - [ ] Subtask 1.1: Import and integrate DropdownMenu from shadcn/ui
  - [ ] Subtask 1.2: Add card menu trigger button (three-dot icon)
  - [ ] Subtask 1.3: Add "Delete" menu item that triggers confirmation dialog

- [ ] Task 2: Update card.tsx - Add AlertDialog for confirmation (AC: #1)
  - [ ] Subtask 2.1: Import and integrate AlertDialog from shadcn/ui
  - [ ] Subtask 2.2: Create delete confirmation dialog with "Delete card" title
  - [ ] Subtask 2.3: Add confirm/cancel actions in dialog
  - [ ] Subtask 2.4: Add open state management for dialog

- [ ] Task 3: Add useDeleteCard mutation to use-cards.ts (AC: #1)
  - [ ] Subtask 3.1: Create deleteCard mutation using React Query
  - [ ] Subtask 3.2: Implement optimistic update to remove card from UI immediately
  - [ ] Subtask 3.3: Configure onError rollback if API fails

- [ ] Task 4: Add useCards custom hook integration (AC: #1, #2)
  - [ ] Subtask 4.1: Integrate deleteCard mutation in Card component
  - [ ] Subtask 4.2: Add toast notification with "Undo" action after successful delete

- [ ] Task 5: Implement Undo functionality (AC: #2)
  - [ ] Subtask 5.1: Add undo logic in toast handler
  - [ ] Subtask 5.2: Restore card data (title, columnId, position) on undo
  - [ ] Subtask 5.3: Show success toast when undo is successful

- [ ] Task 6: Add backend tests for card deletion (AC: #1)
  - [ ] Subtask 6.1: Test deleteCard with valid ownership
  - [ ] Subtask 6.2: Test deleteCard with invalid ownership (403)
  - [ ] Subtask 6.3: Test deleteCard on non-existent card (404)

- [ ] Task 7: Add frontend component tests (AC: #1, #2)
  - [ ] Subtask 7.1: Test card menu opens and shows delete option
  - [ ] Subtask 7.2: Test confirmation dialog appears on delete click
  - [ ] Subtask 7.3: Test card is removed after confirming delete
  - [ ] Subtask 7.4: Test undo button restores card

---

## Developer Context Section

### Dependencies

- **Epic 3, Story 3-1 (Card Creation)** - Card component exists
- **Epic 3, Story 3-2 (Card Editing)** - Card has inline edit capability via click handler
- **Epic 3, Story 3-3 (Drag-Drop Between Columns)** - Card drag/drop infrastructure exists
- **Epic 3, Story 3-4 (Drag-Drop Within Column)** - Card reordering infrastructure exists

### CRITICAL IMPLEMENTATION REQUIREMENTS

**Backend:** The delete endpoint already exists at `DELETE /api/cards/:id` in `cards.controller.ts` (lines 99-106). The service method `cardsService.remove()` is already implemented.

**Frontend:** This story adds the UI layer:
1. Card dropdown menu with Delete option (using shadcn/ui DropdownMenu)
2. Confirmation dialog (using shadcn/ui AlertDialog)
3. Toast with Undo (using existing toast system from Story 1-8)

### Key Implementation Patterns

**Card Menu Pattern (from Story 3-2 for inline edit):**
- Story 3-2 added click-to-edit functionality on card title
- This story adds a menu button next to the title with dropdown menu

**Toast with Undo Pattern (from Story 1-7):**
- Project deletion used toast with 5-second undo window
- Card deletion should follow the exact same pattern
- Undo requires storing deleted card data temporarily

**Optimistic Update Pattern (from Stories 3-3, 3-4):**
- Drag-drop uses optimistic updates
- Card deletion should remove card from UI immediately
- Rollback on API failure with error toast

### Files to Modify

| File | Change |
|------|--------|
| `frontend/src/features/cards/card.tsx` | Add DropdownMenu, AlertDialog, delete handler |
| `frontend/src/features/cards/use-cards.ts` | Add useDeleteCard mutation |
| `frontend/src/features/cards/cards.api.ts` | Add deleteCard API call |
| `backend/src/cards/cards.service.spec.ts` | Add delete tests |

### Pre-Implementation Checklist

- [ ] Review card.tsx component structure
- [ ] Review use-cards.ts hook patterns
- [ ] Review toast system from Story 1-8 (empty-state-toast-system)
- [ ] Check AlertDialog usage in other components
- [ ] Review cards.controller.ts DELETE endpoint
- [ ] Review cards.service.ts remove() method

---

## Technical Requirements

### Library Requirements

**shadcn/ui components** - Already installed:
- `DropdownMenu` - For card menu with Delete option
- `AlertDialog` - For delete confirmation
- `Toast` - For notification with Undo (from Story 1-8)

```bash
# Verify components exist
ls frontend/src/components/ui/ | grep -E "dropdown|alert-dialog|toast"
```

**Usage Pattern for DropdownMenu:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm" className="p-1">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleDelete}>
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Usage Pattern for AlertDialog:**
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    {/* Delete menu item triggers this */}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete card?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Toast with Undo Pattern:**
```tsx
import { toast } from "sonner"; // Or your toast library

const handleDelete = () => {
  // Store deleted card data for undo
  const deletedCard = { ...card };

  // Optimistic delete
  deleteCardMutation.mutate(card.id, {
    onSuccess: () => {
      toast("Card deleted", {
        action: {
          label: "Undo",
          onClick: () => handleUndo(deletedCard),
        },
        duration: 5000,
      });
    },
    onError: () => {
      // Rollback handled by React Query
      toast("Failed to delete card");
    },
  });
};

const handleUndo = async (deletedCard: Card) => {
  // Recreate the card
  await createCardMutation.mutateAsync({
    title: deletedCard.title,
    columnId: deletedCard.columnId,
    position: deletedCard.position,
  });
  toast("Card restored");
};
```

### Backend API Requirements

**DELETE /api/cards/:id** (Already implemented)

**Response:**
```typescript
{ message: "Card deleted" }
```

**Required in:**
- `backend/src/cards/cards.controller.ts` - Already exists (lines 99-106)
- `backend/src/cards/cards.service.ts` - Already implements remove()

### Frontend Component Requirements

**Files to Modify:**
- `frontend/src/features/cards/card.tsx` - Add menu + dialog
- `frontend/src/features/cards/use-cards.ts` - Add delete mutation
- `frontend/src/features/cards/cards.api.ts` - Add delete API call

**Files to Create:**
- None required - reusing infrastructure

### State Management

- **Optimistic Delete:** Remove card immediately from React Query cache
- **Undo Storage:** Store deleted card data in a ref or closure for undo
- **Rollback on Error:** React Query automatically handles onError rollback

---

## Architecture Compliance

### Technical Stack (from architecture.md)

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React + Vite | 18+ |
| Styling | Tailwind CSS | v4 |
| UI Components | shadcn/ui | Latest |
| State | React Query | TanStack Query v5 |
| Backend | NestJS | Latest |
| ORM | TypeORM | Latest |
| Database | MySQL | 8.x |

### Naming Conventions

| Layer | Convention | Example |
|-------|------------|---------|
| Database | snake_case | column_id, created_at |
| API | kebab-case | DELETE /api/cards/:id |
| Code | camelCase | handleDelete, deletedCard |
| Components | PascalCase | Card, AlertDialog |
| Files | kebab-case | card.tsx, use-cards.ts |

### API Response Formats

```typescript
// Success - delete
{ message: "Card deleted" }

// Error
{ statusCode: number, message: string | string[], error: string }
```

### Authentication

- All card endpoints protected by `SessionGuard`
- User can only delete their own cards (ownership enforced in service)

---

## Testing Requirements

### Unit Tests (Backend)

**cards.service.spec.ts - Add:**
- Test: remove with valid card ownership - card deleted
- Test: remove with invalid ownership (different user) - 403 Forbidden
- Test: remove non-existent card - 404 Not Found

### Component Tests (Frontend)

**card.test.tsx - Add:**
- Test: card menu trigger is visible
- Test: clicking menu shows Delete option
- Test: clicking Delete shows confirmation dialog
- Test: confirming delete removes card from UI
- Test: clicking Undo restores card

**use-cards.test.ts - Add:**
- Test: deleteCard mutation calls correct API endpoint
- Test: deleteCard optimistic update removes card from cache

### Integration Tests

- Test: Delete card from column - card removed
- Test: Delete card with undo - card restored after undo click
- Test: Delete card without undo - card permanently deleted after 5 seconds
- Test: API failure during delete - card returns to position
- Test: Delete card with description/labels - all related data deleted (cascade)

---

## Previous Story Intelligence

### From Story 3-4 (Drag-Drop Within Column) - COMPLETED

**Key Files Modified:**
- `frontend/src/features/cards/card.tsx` - Added index prop for sortable
- `frontend/src/features/cards/use-cards.ts` - Added useReorderCard mutation

**Learnings:**
- Used React Query mutations with optimistic updates
- Backend already has the needed endpoints - just need frontend integration

### From Story 3-2 (Card Editing) - COMPLETED

**Key Files:**
- `frontend/src/features/cards/card.tsx` - Has inline edit mode with click handler
- `backend/src/cards/cards.controller.ts` - Has PATCH endpoint

**Learnings:**
- Card component already handles user interactions on the title
- Adding menu next to title follows same pattern

### From Story 1-7 (Project CRUD with Undo) - COMPLETED

**Key Files:**
- `frontend/src/features/projects/project-list.tsx` - Has delete with undo
- Toast system implemented in Story 1-8

**Learnings:**
- Undo pattern: store deleted entity, recreate on undo click
- Toast duration 5000ms for undo window

---

## Git Intelligence Summary

### Recent Commits (Expected Patterns)

Based on Epic 3 implementation:
- Story 3-1: Card creation files and components
- Story 3-2: Card editing with inline edit mode
- Story 3-3: Drag-drop between columns with dnd-kit
- Story 3-4: Drag-drop within column with useSortable

**Key Patterns to Follow:**
1. **Frontend:** React Query mutations with optimistic updates
2. **Backend:** Already implemented - no backend changes needed
3. **Testing:** Co-located tests, add to existing test files
4. **UI:** Use shadcn/ui components (DropdownMenu, AlertDialog)

---

## Latest Technical Information

### shadcn/ui DropdownMenu (Latest)

```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
```

### shadcn/ui AlertDialog (Latest)

```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
```

### Toast Library (sonner pattern from Story 1-8)

```tsx
import { toast } from "sonner"

toast("Message", {
  action: { label: "Undo", onClick: () => {} },
  duration: 5000
})
```

---

## Project Context Reference

**Project:** KanbanFlow
**Type:** Full-stack SPA (React/Vite + NestJS + MySQL)
**User:** Raziur (intermediate skill level)

**From project-context.md:**
- Design system: Soft Teal color palette (Teal 600 primary)
- Theming: CSS variables for light/dark mode
- UX patterns: Inline editing, optimistic updates, toast notifications
- Naming: snake_case (DB), kebab-case (API), camelCase/PascalCase (code)

---

## Story Completion Status

**Status:** ready-for-dev
**Implementation:** Ultimate context engine analysis completed - comprehensive developer guide created

---

## Dev Agent Record

### Implementation Notes

**Backend Status:** Complete - DELETE endpoint exists at `DELETE /api/cards/:id`

**Frontend Required:**
1. Card dropdown menu with Delete option
2. AlertDialog for delete confirmation
3. Toast with Undo action
4. useDeleteCard mutation with optimistic update

**Key Decisions:**
1. Use shadcn/ui DropdownMenu for card menu
2. Use shadcn/ui AlertDialog for confirmation
3. Use existing toast system (sonner) for undo notification
4. Store deleted card data for undo recreation

---

## File List

- `frontend/src/features/cards/card.tsx` - Add DropdownMenu + AlertDialog + handlers
- `frontend/src/features/cards/use-cards.ts` - Add useDeleteCard mutation
- `frontend/src/features/cards/cards.api.ts` - Add deleteCard API call
- `frontend/src/features/cards/card.test.tsx` - Add delete + undo tests
- `backend/src/cards/cards.service.spec.ts` - Add delete tests (optional - already exists)

---

## Change Log

- 2026-05-11: Story 3-5 Card Deletion created
  - Backend delete endpoint already exists
  - Need to add frontend UI: menu, dialog, toast with undo
  - Follows patterns from Story 1-7 (Project delete with undo) and Story 3-2 (card menu)

---

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.5-Card-Deletion]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Communication-Patterns]
- [Implementation: _bmad-output/implementation-artifacts/3-4-drag-drop-within-column.md]
- [Implementation: _bmad-output/implementation-artifacts/3-2-card-editing.md]
- [Implementation: _bmad-output/implementation-artifacts/1-7-project-crud.md]
- [File: frontend/src/features/cards/card.tsx]
- [File: frontend/src/features/cards/use-cards.ts]
- [File: frontend/src/features/cards/cards.api.ts]
- [File: backend/src/cards/cards.controller.ts]
- [File: backend/src/cards/cards.service.ts]