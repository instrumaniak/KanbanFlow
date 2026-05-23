# Story 4.3: Color-Coded Labels

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to assign color-coded labels to cards,
So that I can visually categorize and scan my tasks.

## Acceptance Criteria

1. **Given** I am viewing the card detail panel
   **When** I click on the Labels section
   **Then** a LabelPicker appears with 6 colors: Red, Orange, Yellow, Green, Blue, Purple
   **And** each color can have a custom name

2. **Given** I select a label
   **When** the label is applied
   **Then** the label appears as a pill-shaped badge on the card
   **And** the badge shows the label color and name (if set)

3. **Given** I deselect a label
   **When** the label is removed
   **Then** the badge disappears from the card

4. **Given** I view the board
   **When** cards have labels
   **Then** labels are visible on the card face for quick visual scanning
   **And** label colors meet WCAG AA contrast requirements in both light and dark mode

5. **Given** I need a new label not in the default set
   **When** I create a new label
   **Then** I can choose a name (1–50 characters) and one of the 6 preset colors
   **And** the new label appears in my LabelPicker

6. **Given** I want to rename or delete a label
   **When** I edit the label name or delete it
   **Then** the change applies immediately
   **And** deleting a label removes it from all cards it was assigned to

7. **Given** I am an existing user (registered before this feature)
   **When** I first use the label feature
   **Then** the 6 default labels are auto-created for me

8. **Given** I try to assign a label that is already on a card
   **When** I attempt to add it again
   **Then** the request is idempotent (no error, no duplicate)

## Tasks / Subtasks

- [ ] Database: Create `labels` and `card_labels` tables via TypeORM migration (with `ON DELETE CASCADE` on both FKs)
- [ ] Backend: Create `Label` entity with id, name, color, user_id, timestamps
- [ ] Backend: Create `CardLabel` join entity for many-to-many card-label relationship (both FKs with `onDelete: 'CASCADE'`)
- [ ] Backend: Update `Card` entity to include `@ManyToMany(() => Label)` (NO `@JoinTable` — use `CardLabel` entity instead)
- [ ] Backend: Update `User` entity to add `labels` inverse relation property
- [ ] Backend: Register `Label` entity and migration in `typeorm-registry.ts`
- [ ] Backend: Import `LabelsModule` into `AppModule`
- [ ] Backend: Create Labels module (controller, service, DTOs)
  - [ ] `GET /api/labels` — list all labels for current user
  - [ ] `POST /api/labels` — create a new label (name + color from 6 presets)
  - [ ] `PATCH /api/labels/:id` — update label name
  - [ ] `DELETE /api/labels/:id` — delete label (cascade remove from cards)
- [ ] Backend: Update Cards module endpoints
  - [ ] `GET /api/cards/:id` — include assigned labels in response
  - [ ] `POST /api/cards/:id/labels` — assign label to card
  - [ ] `DELETE /api/cards/:id/labels/:labelId` — remove label from card
- [ ] Backend: Seed 6 default labels on user registration
- [ ] Backend: Seed default labels for existing users on first label fetch (lazy migration)
- [ ] Backend: Run migration locally and verify
- [ ] Backend: Update `CardsService` — add `relations: ['labels']` to `findAllByColumnId`
- [ ] Backend: Update `toCardResponse()` to include `labels` array
- [ ] Backend: Create `GET /api/cards/:id` endpoint (does not currently exist)
- [ ] Frontend: Update `Card` interface to include `labels: Label[]`
- [ ] Frontend: Create `labels.api.ts` with React Query hooks
  - [ ] `useLabels()` — fetch user labels
  - [ ] `useCreateLabel()` — create label mutation
  - [ ] `useUpdateLabel()` — update label mutation
  - [ ] `useDeleteLabel()` — delete label mutation
  - [ ] `useAssignLabel()` — assign label to card mutation
  - [ ] `useRemoveLabel()` — remove label from card mutation
- [ ] Frontend: Create `LabelPicker` component
  - [ ] Grid of 6 color swatches with label names
  - [ ] Toggle on/off to assign/remove from card
  - [ ] Inline input to rename each label
  - [ ] Create new label flow (select color + type name)
- [ ] Frontend: Create `LabelBadge` component
  - [ ] Pill-shaped badge with background color and text
  - [ ] Small size for card face, medium for detail panel
  - [ ] Dark mode compatible colors
- [ ] Frontend: Integrate LabelPicker into `CardDetailPanel`
  - [ ] Replace "Labels will be available in a future update" placeholder
  - [ ] Show current card labels with remove button
  - [ ] Open LabelPicker to add more labels
- [ ] Frontend: Add label badges to `Card` component face
  - [ ] Show labels below title (or next to title if space allows)
  - [ ] Max 3 labels visible, +N indicator if more
  - [ ] Ensure badges do not break drag-drop or card layout
- [ ] Frontend: Update React Query cache invalidation for label mutations
- [ ] Tests: Backend unit tests for Labels controller and service
- [ ] Tests: Backend integration tests for label CRUD and card assignment
  - [ ] Create label with empty name → 400 Bad Request
  - [ ] Create duplicate label name → 409 Conflict (or follow project convention)
  - [ ] Update label name to empty string → 400 Bad Request
  - [ ] Delete label assigned to cards → verify cascade removal from `card_labels`
  - [ ] Cross-user isolation: User A cannot read/update/delete User B's labels
  - [ ] Cross-user isolation: User A cannot assign User B's label to their own card
  - [ ] Assign already-assigned label → 200 OK (idempotent)
  - [ ] Remove label not assigned to card → 404 Not Found
  - [ ] Assign non-existent labelId → 404 Not Found
  - [ ] Transaction rollback on failed label assignment
  - [ ] Default label seeding on registration
  - [ ] Default label lazy-seeding for existing users with zero labels
- [ ] Tests: Frontend tests for LabelPicker, LabelBadge, Card label display
  - [ ] LabelPicker renders all user labels with correct colors
  - [ ] Toggle assign/remove updates selection state
  - [ ] Inline rename triggers debounced mutation
  - [ ] LabelBadge renders correct Tailwind classes for each color
  - [ ] Card face shows max 3 labels + `+N` overflow indicator
  - [ ] Dark mode classes applied correctly
- [ ] Tests: E2E test for label creation, assignment, and persistence
  - [ ] Create a new label → verify it appears in LabelPicker
  - [ ] Assign label to card → verify badge appears in detail panel
  - [ ] Close and reopen card detail → verify label still assigned
  - [ ] Remove label from card → verify badge disappears
  - [ ] Delete label → verify removed from all cards on board
  - [ ] Rename label → verify new name on card face and detail panel

## Dev Notes

### Architecture Compliance

- **NestJS module pattern**: Create new `src/labels/` module. Do NOT put label logic in `src/cards/`.
- **Feature-based frontend**: Create `frontend/src/features/labels/label-picker.tsx`, `label-badge.tsx`, `use-labels.ts`, `labels.api.ts`.
- **API pattern**: RESTful endpoints per architecture.md. Use kebab-case plural: `/api/labels`.
- **React Query**: All server state via React Query. Co-locate hooks with features.
- **shadcn/ui**: Use `Badge` as base for label badges (customize colors). Use `Popover` or `DropdownMenu` for LabelPicker container.

### Database Migration Required

```bash
# Generate migration after creating/updating entities
npm run migration:generate -- src/migrations/1710825600011-CreateLabelsAndCardLabelsTables
```

Migration must create:
- `labels` table: id (PK), name (varchar 50), color (varchar 20), user_id (FK → users.id, ON DELETE CASCADE), created_at, updated_at
- `card_labels` join table: card_id (FK → cards.id, ON DELETE CASCADE), label_id (FK → labels.id, ON DELETE CASCADE), composite PK(card_id, label_id)

**CRITICAL**: Both FKs in `card_labels` must have `ON DELETE CASCADE`. Deleting a card must remove its join records. Deleting a label must remove it from all cards. This is enforced by the `CardLabel` entity, not by `@JoinTable`.

### Label Entity

```typescript
// backend/src/labels/entities/label.entity.ts
@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => User, (user) => user.labels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.label)
  cardLabels: CardLabel[];

  @ManyToMany(() => Card, (card) => card.labels)
  cards: Card[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### CardLabel Join Entity

```typescript
// backend/src/cards/entities/card-label.entity.ts
@Entity('card_labels')
export class CardLabel {
  @ManyToOne(() => Card, (card) => card.cardLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @PrimaryColumn({ name: 'card_id', type: 'int' })
  cardId: number;

  @ManyToOne(() => Label, (label) => label.cardLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'label_id' })
  label: Label;

  @PrimaryColumn({ name: 'label_id', type: 'int' })
  labelId: number;
}
```

### Card Entity Updates

```typescript
// backend/src/cards/entities/card.entity.ts
// Add to existing Card entity:

@OneToMany(() => CardLabel, (cardLabel) => cardLabel.card)
cardLabels: CardLabel[];

@ManyToMany(() => Label, (label) => label.cards)
labels: Label[];
```

**IMPORTANT**: Do NOT use `@JoinTable`. The `CardLabel` join entity manages the relationship and enforces `ON DELETE CASCADE` on both FKs. Deleting a card removes its join records (not the labels). Deleting a label removes it from all cards via cascade.

### User Entity Updates

```typescript
// backend/src/users/entities/user.entity.ts
// Add to existing User entity:

@OneToMany(() => Label, (label) => label.user)
labels: Label[];
```

### API Endpoints

**Labels Module** (`backend/src/labels/labels.controller.ts`):
```typescript
@Controller('api/labels')
@UseGuards(AuthGuard)
export class LabelsController {
  @Get()
  findAll(@CurrentUser() user: User): Promise<Label[]> { ... }

  @Post()
  create(@Body() createLabelDto: CreateLabelDto, @CurrentUser() user: User): Promise<Label> { ... }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateLabelDto: UpdateLabelDto, @CurrentUser() user: User): Promise<Label> { ... }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<void> { ... }
}
```

**Card Label Assignment** (`backend/src/cards/cards.controller.ts`):
```typescript
@Post(':id/labels')
assignLabel(@Param('id', ParseIntPipe) cardId: number, @Body('labelId') labelId: number, @CurrentUser() user: User): Promise<Card> { ... }

@Delete(':id/labels/:labelId')
@HttpCode(204)
removeLabel(@Param('id', ParseIntPipe) cardId: number, @Param('labelId', ParseIntPipe) labelId: number, @CurrentUser() user: User): Promise<void> { ... }
```

**IMPORTANT**: `GET /api/cards/:id` does not currently exist. It must be created in `CardsController` to support fetching a single card with its labels for the detail panel.

### DTOs

**CreateLabelDto:**
```typescript
export class CreateLabelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsEnum(['red', 'orange', 'yellow', 'green', 'blue', 'purple'])
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
}
```

**UpdateLabelDto:**
```typescript
export class UpdateLabelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;
}
```

**Validation Rules:**
- Label names must be **unique per user** (case-insensitive). `LabelsService.create()` must check for existing name and throw `ConflictException` if duplicate.
- `name` cannot be empty or whitespace-only (`@MinLength(1)` + trim check in service).
- `color` is restricted to the 6 preset enum values.

**Required imports**: `ParseIntPipe` from `@nestjs/common`, `MinLength` from `class-validator`.

### API Response Serialization

`toCardResponse()` in `backend/src/cards/cards.service.ts` must include the `labels` array:

```typescript
function toCardResponse(card: Card) {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    columnId: card.columnId,
    position: card.position,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    labels: card.labels?.map((l) => ({ id: l.id, name: l.name, color: l.color })) || [],
  };
}
```

Also update `findAllByColumnId()` to eagerly load labels:
```typescript
this.cardsRepository.find({
  where: { columnId },
  relations: ['labels'],
  order: { position: 'ASC' },
});
```

### Ownership & Security Checks

Every label endpoint must verify the label belongs to the current user:

- `LabelsService.findAll(userId)` — filter by `user_id`
- `LabelsService.update(id, userId)` — verify `label.user_id === user.id` before updating
- `LabelsService.remove(id, userId)` — verify `label.user_id === user.id` before deleting
- `CardsService.assignLabel(cardId, labelId, userId)` — verify BOTH that the card belongs to the user (via `card.column.board.user_id`) AND the label belongs to the user (`label.user_id === user.id`)
- `CardsService.removeLabel(cardId, labelId, userId)` — same dual-ownership check

**Pattern**: Follow the existing `CardsService.findCardById()` ownership check. Reject with `ForbiddenException` if ownership fails.

### Duplicate Assignment Behavior

`POST /api/cards/:id/labels` is **idempotent**:
- If the label is already assigned to the card → return `200 OK` with the card (no error, no duplicate join record)
- If not assigned → assign it and return `201 Created`

### Registry & Module Registration

**CRITICAL**: The project uses an explicit TypeORM entity registry (`backend/src/database/typeorm-registry.ts`) because Webpack cannot bundle dynamic globs. You MUST manually add:

```typescript
// backend/src/database/typeorm-registry.ts
import { Label } from '../labels/entities/label.entity';
import { CardLabel } from '../cards/entities/card-label.entity';
import { CreateLabelsAndCardLabelsTables1710825600011 } from '../migrations/1710825600011-CreateLabelsAndCardLabelsTables';

export const entities = [/* ...existing... */, Label, CardLabel];
export const migrations = [/* ...existing... */, CreateLabelsAndCardLabelsTables1710825600011];
```

Also register the module:
```typescript
// backend/src/app.module.ts
import { LabelsModule } from './labels/labels.module';

@Module({
  imports: [/* ...existing... */, LabelsModule],
})
```

### Existing User Default Label Strategy

Default labels are seeded on registration for **new users**. For **existing users** who have zero labels, lazy-seed defaults on the first call to `GET /api/labels`:

```typescript
// In LabelsService.findAll(userId)
async findAll(userId: number): Promise<Label[]> {
  const labels = await this.labelsRepository.find({ where: { user_id: userId } });
  if (labels.length === 0) {
    // Seed defaults and return them
    return this.seedDefaultLabels(userId);
  }
  return labels;
}
```

This avoids a one-time data migration and ensures all users have the default set.

### Frontend Label Colors (Tailwind Classes)

Use the design system tokens from UX spec:

| Color | Light Mode Classes | Dark Mode Classes |
|-------|-------------------|-------------------|
| Red | `bg-rose-100 text-rose-700` | `dark:bg-rose-950 dark:text-rose-400` |
| Orange | `bg-orange-100 text-orange-700` | `dark:bg-orange-950 dark:text-orange-400` |
| Yellow | `bg-yellow-100 text-yellow-700` | `dark:bg-yellow-950 dark:text-yellow-400` |
| Green | `bg-green-100 text-green-700` | `dark:bg-green-950 dark:text-green-400` |
| Blue | `bg-blue-100 text-blue-700` | `dark:bg-blue-950 dark:text-blue-400` |
| Purple | `bg-purple-100 text-purple-700` | `dark:bg-purple-950 dark:text-purple-400` |

**Map color string to classes:**
```typescript
const labelColorMap: Record<string, string> = {
  red: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
};
```

### LabelBadge Component

```tsx
// frontend/src/features/labels/label-badge.tsx
interface LabelBadgeProps {
  label: Label;
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

export function LabelBadge({ label, size = 'sm', onRemove }: LabelBadgeProps) {
  const colorClasses = labelColorMap[label.color] || 'bg-gray-100 text-gray-700';
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClasses} ${sizeClasses}`}>
      {label.name}
      {onRemove && (
        <button onClick={onRemove} aria-label={`Remove ${label.name} label`} className="ml-1">
          <XIcon className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
```

### LabelPicker Component

```tsx
// frontend/src/features/labels/label-picker.tsx
// Renders a grid of color swatches. Each swatch shows:
// - The label color as a dot/chip
// - The label name (editable inline)
// - A checkmark or highlight when selected

interface LabelPickerProps {
  cardId: number;
  assignedLabels: Label[];
  onAssign: (labelId: number) => void;
  onRemove: (labelId: number) => void;
}
```

**Behavior:**
- Fetch all user labels via `useLabels()`
- Show grid of 6 preset colors (or all user labels)
- Click to toggle assign/remove from current card
- Inline edit to rename label (debounced save via `useUpdateLabel()`)
- "Create new label" option if user wants additional labels beyond presets

### Integration into CardDetailPanel

Replace the Labels placeholder section in `frontend/src/features/cards/card-detail-panel.tsx`:

```tsx
{/* Labels Section */}
<div className="space-y-2">
  <h3 className="text-sm font-medium">Labels</h3>
  <div className="flex flex-wrap gap-1.5">
    {card.labels?.map((label) => (
      <LabelBadge key={label.id} label={label} size="md" onRemove={() => removeLabel(label.id)} />
    ))}
  </div>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <PlusIcon className="h-4 w-4 mr-1" />
        Add label
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-64">
      <LabelPicker
        cardId={card.id}
        assignedLabels={card.labels || []}
        onAssign={(labelId) => assignLabel(labelId)}
        onRemove={(labelId) => removeLabel(labelId)}
      />
    </PopoverContent>
  </Popover>
</div>
```

### Integration into Card Component Face

Modify `frontend/src/features/cards/card.tsx`:

Below the title (and description preview from Story 4.2), add:

```tsx
{card.labels && card.labels.length > 0 && (
  <div className="mt-1.5 flex flex-wrap gap-1">
    {card.labels.slice(0, 3).map((label) => (
      <LabelBadge key={label.id} label={label} size="sm" />
    ))}
    {card.labels.length > 3 && (
      <span className="text-[10px] text-muted-foreground self-center">+{card.labels.length - 3}</span>
    )}
  </div>
)}
```

**IMPORTANT**: Label badges must be INSIDE the card's drag handle area but must NOT interfere with drag initiation. The existing drag distance check from Story 4.1 should handle this.

### Default Label Seeding

On user registration, create 6 default labels:
```typescript
const defaultLabels = [
  { name: 'Urgent', color: 'red' },
  { name: 'Important', color: 'orange' },
  { name: 'In Progress', color: 'yellow' },
  { name: 'Done', color: 'green' },
  { name: 'Bug', color: 'blue' },
  { name: 'Feature', color: 'purple' },
];
```

Add this to `backend/src/auth/auth.service.ts` in the `register()` method AFTER user creation. Use `LabelsService` injected into `AuthService`. This creates a cross-module coupling — it is acceptable here because registration is a one-time orchestration point, but keep the seeding logic delegated to `LabelsService.seedDefaultLabels(userId)`.

### State Management

- `useLabels()` query key: `['labels']`
- `useAssignLabel()` mutation: onSuccess invalidate `['cards', columnId]` and `['card', cardId]`
- `useRemoveLabel()` mutation: same invalidation
- `useCreateLabel()` mutation: onSuccess invalidate `['labels']`
- `useUpdateLabel()` mutation: onSuccess invalidate `['labels']` and `['cards']` (all card queries since labels appear on cards)
- `useDeleteLabel()` mutation: onSuccess invalidate `['labels']` and `['cards']`

### Accessibility

- LabelPicker: `aria-label="Assign labels"`
- Each label swatch: `role="button"`, `aria-pressed={isSelected}`, `aria-label="${label.name} label"`
- LabelBadge remove button: `aria-label="Remove ${label.name}"`
- Color + text always shown together (never color alone per WCAG)

### Project Structure Notes

Backend:
- `backend/src/labels/entities/label.entity.ts` — new
- `backend/src/labels/dto/create-label.dto.ts` — new
- `backend/src/labels/dto/update-label.dto.ts` — new
- `backend/src/labels/labels.controller.ts` — new
- `backend/src/labels/labels.service.ts` — new
- `backend/src/labels/labels.module.ts` — new
- `backend/src/cards/entities/card-label.entity.ts` — new
- `backend/src/cards/entities/card.entity.ts` — add `@ManyToMany(() => Label)` and `@OneToMany(() => CardLabel)`
- `backend/src/cards/cards.controller.ts` — add `GET /api/cards/:id`, assign/remove label endpoints
- `backend/src/cards/cards.service.ts` — add `findById`, `assignLabel`, `removeLabel` methods; update `findAllByColumnId` with `relations: ['labels']`
- `backend/src/cards/cards.mapper.ts` — update `toCardResponse()` to include `labels`
- `backend/src/users/entities/user.entity.ts` — add `labels` inverse relation
- `backend/src/database/typeorm-registry.ts` — register `Label`, `CardLabel`, and migration
- `backend/src/app.module.ts` — import `LabelsModule`
- `backend/src/auth/auth.service.ts` — seed default labels on registration
- `backend/src/migrations/...-CreateLabelsAndCardLabelsTables.ts` — new migration

Frontend:
- `frontend/src/features/labels/label-picker.tsx` — new
- `frontend/src/features/labels/label-badge.tsx` — new
- `frontend/src/features/labels/use-labels.ts` — new
- `frontend/src/features/labels/labels.api.ts` — new
- `frontend/src/features/cards/card-detail-panel.tsx` — replace Labels placeholder
- `frontend/src/features/cards/card.tsx` — add label badges to card face
- `frontend/src/features/cards/cards.api.ts` — add `labels: Label[]` to Card interface
- `frontend/src/features/cards/use-cards.ts` — no changes needed (types auto-update)

### Previous Story Intelligence

- Story 4.1 established `CardDetailPanel` with `Sheet`, `ScrollArea`, `Textarea`, `Separator`. Labels section was a placeholder — now replace it.
- Story 4.2 upgraded the Description section with `Tabs` and `react-markdown`. The panel structure is mature and stable.
- The `Card` component currently shows: title, description preview (2 lines). Add label badges after description preview.
- `useUpdateCard()` hook pattern: optimistic updates + query invalidation on success. Follow same pattern for label mutations.
- API error handling: `onError` shows toast with error message. Apply to all label mutations.
- Backend `CardsService` uses `dataSource.transaction()` for atomicity. Label assignment/removal should also be wrapped in transactions.
- Backend tests: Cards module has 20 passing tests. Add Labels module tests following same patterns.

### Git Intelligence

- Recent commits: Story 4.2 completed (markdown description), backend uses NestJS + TypeORM + Fastify
- Frontend: React Query, shadcn/ui, Tailwind CSS v4
- Code style: single quotes, trailing commas, printWidth 100
- Tests co-located with source files
- Migration pattern: entity change → generate migration → run locally → commit both

## References

- [Source: epics.md#Story 4.3: Color-Coded Labels]
- [Source: architecture.md#Core Entities — Board entity, Tags entity pattern]
- [Source: architecture.md#Database Migration Strategy]
- [Source: architecture.md#Structure Patterns — labels/ module]
- [Source: ux-design-specification.md#Component Strategy — LabelPicker, Card component]
- [Source: ux-design-specification.md#Color System — Label Colors table]
- [Source: project-context.md#Critical Implementation Rules]
- [Source: 4-1-card-detail-panel.md — CardDetailPanel structure with Labels placeholder]
- [Source: 4-2-markdown-description.md — Card component with description preview]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
