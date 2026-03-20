# Story 1.2: Database Schema Setup

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the database schema initialized with TypeORM,
so that the application can persist user and project data.

## Acceptance Criteria

1. **Given** a MySQL database is available, **When** I configure the `.env` file with database credentials, **Then** the NestJS ConfigModule loads configuration with validation
2. **And** TypeORM connects to MySQL with `synchronize: false`
3. **And** a `data-source.ts` file exists for TypeORM CLI
4. **And** initial migration creates `users` and `projects` tables
5. **And** `users` table has: id, email, password, role, created_at, updated_at
6. **And** `projects` table has: id, name, user_id (FK), created_at, updated_at
7. **And** `npm run migration:run` executes successfully

## Tasks / Subtasks

- [ ] Task 1: Install backend dependencies (AC: 1, 2)
  - [ ] Install `@nestjs/config` for ConfigModule
  - [ ] Install `@nestjs/typeorm` and `typeorm` for ORM
  - [ ] Install `mysql2` driver for MySQL connectivity
  - [ ] Install `class-validator` and `class-transformer` for .env validation
  - [ ] Install `dotenv` for data-source.ts standalone loading
- [ ] Task 2: Create `.env` file with database configuration (AC: 1)
  - [ ] Create `backend/.env` with DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
  - [ ] Create `backend/.env.example` with placeholder values for documentation
  - [ ] Add NODE_ENV=development
- [ ] Task 3: Create configuration module (AC: 1)
  - [ ] Create `backend/src/config/configuration.ts` using `registerAs('database', ...)`
  - [ ] Validate config with class-validator decorators (IsString, IsNumber, IsOptional)
  - [ ] Export typed config interface
- [ ] Task 4: Create TypeORM data-source for CLI (AC: 3)
  - [ ] Create `backend/src/data-source.ts` as standalone DataSource
  - [ ] Load .env with dotenv, read config with ConfigService
  - [ ] Set `synchronize: false`, `migrationsRun: false`
  - [ ] Point entities to `dist/**/*.entity.js` and migrations to `dist/migrations/*.js`
- [ ] Task 5: Configure TypeORM in app.module.ts (AC: 2)
  - [ ] Add `ConfigModule.forRoot()` with validation
  - [ ] Add `TypeOrmModule.forRootAsync()` with inject ConfigService
  - [ ] Configure: type mysql, entities auto-load, migrations path, synchronize false
- [ ] Task 6: Create User entity (AC: 5)
  - [ ] Create `backend/src/users/entities/user.entity.ts`
  - [ ] Columns: id (PK auto-increment), email (unique), password, role (default 'user'), created_at, updated_at
  - [ ] Add OneToMany relation to Project
- [ ] Task 7: Create Project entity (AC: 6)
  - [ ] Create `backend/src/projects/entities/project.entity.ts`
  - [ ] Columns: id (PK auto-increment), name, user_id (FK integer), created_at, updated_at
  - [ ] Add ManyToOne relation to User with onDelete CASCADE
- [ ] Task 8: Generate and run initial migration (AC: 4, 7)
  - [ ] Run `npm run build` to compile entities
  - [ ] Run `npm run migration:generate -- src/migrations/1710825600000-CreateUsersProjects`
  - [ ] Review generated migration SQL
  - [ ] Run `npm run migration:run`
  - [ ] Verify with `npm run migration:show`
- [ ] Task 9: Add migration scripts to package.json (AC: 7)
  - [ ] Add `typeorm` script
  - [ ] Add `migration:generate`, `migration:create`, `migration:run`, `migration:revert`, `migration:show`, `db:sync` scripts

## Dev Notes

### Previous Story Intelligence

**From Story 1.1 (Project Initialization):**
- Monorepo structure created: `frontend/` and `backend/` directories at project root
- Backend initialized with NestJS CLI — `backend/src/main.ts`, `backend/src/app.module.ts` exist
- Frontend uses Vite + React + TypeScript with shadcn/ui initialized
- Root `.prettierrc` configured (semi: true, singleQuote: true, trailingComma: "all", printWidth: 100, tabWidth: 2)
- Root `.gitignore` covers node_modules, dist, .env patterns
- TypeScript strict mode enabled in both frontend and backend
- Backend has `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`
- Backend `.prettierrc` removed (using root config)

**Patterns established:**
- Backend files: `kebab-case` (e.g., `board.entity.ts`)
- NestJS modules use `@Module()` decorators with DI via constructor
- Separate tsconfig for frontend (Vite) and backend (NestJS)
- Tests co-located with implementation files (`.spec.ts` for backend)

### Architecture Compliance

**TypeORM + MySQL Configuration:**
- `synchronize: false` ALWAYS — no exceptions. Every schema change goes through migrations [Source: architecture.md#Database Migration Strategy]
- Entities auto-discovered from `dist/**/*.entity.js` (compiled) or `src/**/*.entity.ts` (dev)
- Migrations stored in `src/migrations/`, compiled to `dist/migrations/`
- `migrationsRun: false` — always explicit manual migration runs

**data-source.ts Structure:**
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
  migrationsRun: false,
  synchronize: false,
});
```
[Source: architecture.md#Database Migration Strategy - Configuration]

**app.module.ts TypeORM Config:**
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
    synchronize: false,
  }),
}),
```
[Source: architecture.md#Database Migration Strategy - Configuration]

### Database Naming Conventions

- Tables: `snake_case` plural (e.g., `users`, `projects`)
- Columns: `snake_case` (e.g., `created_at`, `user_id`)
- Foreign keys: `{referenced_table}_id` (e.g., `user_id`)
- Primary keys: `id` (auto-increment integer)
- Indexes: `idx_{table}_{columns}` (e.g., `idx_projects_user_id`)
[Source: architecture.md#Implementation Patterns - Naming Patterns]

### Entity Specifications

**User Entity (`backend/src/users/entities/user.entity.ts`):**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Project, (project) => project.user)
  projects: Project[];
}
```

**Project Entity (`backend/src/projects/entities/project.entity.ts`):**
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  user_id: number;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

### .env Configuration

```env
# Development
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=user
DB_PASSWORD=password
DB_NAME=kanbanflow_dev
```
[Source: architecture.md#Database Migration Strategy - Configuration]

### Migration Scripts (package.json)

Add to `backend/package.json` scripts:
```json
{
  "typeorm": "typeorm-ts-node-commonjs",
  "migration:generate": "npm run typeorm migration:generate -- -d src/data-source.ts",
  "migration:create": "npm run typeorm migration:create",
  "migration:run": "npm run typeorm migration:run -- -d src/data-source.ts",
  "migration:revert": "npm run typeorm migration:revert -- -d src/data-source.ts",
  "migration:show": "npm run typeorm migration:show -- -d src/data-source.ts",
  "db:sync": "npm run migration:run"
}
```
[Source: architecture.md#Database Migration Strategy - Package Scripts]

### Migration Naming Convention

```
{timestamp}-{action}-{table}-{description}.ts
```
Actions: `Create`, `Add`, `Remove`, `Rename`, `Alter`, `Seed`
[Source: architecture.md#Database Migration Strategy - Migration Naming Convention]

### ConfigModule Setup

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validate,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ /* ... */ }),
    }),
  ],
})
export class AppModule {}
```

### Critical Anti-Patterns

- ❌ NEVER set `synchronize: true` — no exceptions [Source: architecture.md#Non-Negotiable Migration Rules]
- ❌ NEVER return raw database errors to frontend — use NestJS exceptions [Source: architecture.md#Implementation Patterns - Error Handling]
- ❌ NEVER use `any` type — strict TypeScript [Source: architecture.md#Anti-Patterns to Avoid]
- ❌ NEVER auto-run migrations on app start — explicit runs only [Source: architecture.md#Non-Negotiable Migration Rules]
- ❌ NEVER modify applied migrations — create new one to fix [Source: architecture.md#Non-Negotiable Migration Rules]

### Migration Workflow (for reference)

1. Create/modify entity file
2. Run `npm run migration:generate -- src/migrations/{timestamp}-{Action}{Table}`
3. Review generated migration SQL
4. Run `npm run migration:run`
5. Verify with `npm run migration:show`
6. Commit entity + migration together
[Source: architecture.md#Database Migration Strategy - Schema Change Workflow]

### Project Structure After This Story

```
backend/
├── .env                              (created)
├── .env.example                      (created)
├── package.json                      (modified - migration scripts)
└── src/
    ├── app.module.ts                 (modified - ConfigModule + TypeORM)
    ├── config/
    │   └── configuration.ts          (created)
    ├── data-source.ts                (created)
    ├── migrations/
    │   └── {timestamp}-CreateUsersProjects.ts  (generated)
    ├── users/
    │   └── entities/
    │       └── user.entity.ts        (created)
    └── projects/
        └── entities/
            └── project.entity.ts     (created)
```

### References

- [Source: architecture.md#Database Migration Strategy] — Complete migration workflow, configuration, naming conventions, package scripts
- [Source: architecture.md#Implementation Patterns - Naming Patterns] — DB table/column naming conventions
- [Source: architecture.md#Project Structure & Boundaries] — Backend directory structure
- [Source: architecture.md#Core Architectural Decisions - Data Architecture] — TypeORM + MySQL decisions
- [Source: project-context.md#Technology Stack & Versions] — Backend tech stack
- [Source: project-context.md#Critical Implementation Rules] — Language and framework rules
- [Source: project-context.md#Development Workflow Rules] — Database workflow rules
- [Source: epics.md#Story 1.2] — Original story acceptance criteria
- [Source: implementation-artifacts/1-1-project-initialization.md] — Previous story context and file list

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
