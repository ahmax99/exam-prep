# Database Migration Safety Check

Review Prisma schema changes and migrations for safety before applying. The schema lives in `shared/neon/prisma/schema.prisma`; the generated client is git-ignored and produced by `db:generate`.

## Process

### 1. Identify Changes

```bash
git diff origin/main...HEAD -- shared/neon/prisma/
```

Read the changed `schema.prisma` file and any new migration files under `shared/neon/prisma/migrations/`.

### 2. Safety Checks

For each schema change, evaluate:

**Data loss risks:**

- [ ] Dropping a column or table — is data backed up or migrated?
- [ ] Renaming a column — is it a rename or a drop+add (which loses data)?
- [ ] Changing a column type — will existing data convert safely?
- [ ] Adding `NOT NULL` to an existing column — is there a default or backfill?
- [ ] Removing a relation — are orphaned records handled?

**Performance risks (Neon serverless Postgres):**

- [ ] Adding an index on a large table — will the migration lock the table? (consider `CREATE INDEX CONCURRENTLY`)
- [ ] Adding a column with a default — will it rewrite the entire table?
- [ ] New `@unique` constraint — does existing data satisfy it?

**Application compatibility:**

- [ ] Is the Prisma client regenerated? (`turbo db:generate --filter=@shared/neon`, which is also neon's `prebuild`)
- [ ] Are the affected `*.service.ts` methods updated to match the schema change? (services in `apps/backend-boilerplate/src/modules/*` query `prisma` directly)
- [ ] Are the `@shared/config` Zod models updated for new/changed fields so both apps stay in sync?
- [ ] Does any code still reference removed columns?

**Authorization & soft-delete:**

- [ ] If the model is soft-deletable, does it have a `deletedAt` column and do reads filter `deletedAt: null`?
- [ ] Do new models/fields need CASL rules in `auth/permission.ts` so `accessibleBy(ability)` and `ability.can(...)` cover them?

### 3. Migration SQL Review

If migration SQL files exist, read them and check:

- Operations are idempotent or wrapped in a transaction
- No raw SQL that could fail on partial application
- A rollback path exists

### 4. Report

```
## Migration Safety Report

### Schema Changes
| Change | Type | Risk | Notes |
|--------|------|------|-------|
| ... | add/modify/drop | Low/Medium/High | ... |

### Safety Checks
- Data loss: SAFE / AT RISK
- Performance: SAFE / CAUTION
- App compatibility: COMPATIBLE / BREAKING
- Authz / soft-delete: SAFE / AT RISK

### Recommendations
- ...

### Verdict
[SAFE TO MIGRATE | NEEDS ATTENTION | BLOCK]
```

To apply in development after a clean report: `cd shared/neon && bun run db:migrate` (interactive `prisma migrate dev`).
