# Backend API

NestJS, Prisma, and Supabase PostgreSQL configuration for the Mobile Social Network MVP.

## Local setup

1. Copy `.env.example` to `.env` without committing it.
2. Copy `DATABASE_URL` and `DIRECT_URL` directly from Supabase **Project → Connect → ORM → Prisma**.
3. Set a local `JWT_SECRET` and, optionally, `PORT`.
4. Install dependencies and generate the Prisma Client:

   ```powershell
   corepack pnpm@12.4.1 install
   corepack pnpm@12.4.1 prisma:generate
   ```

5. Validate configuration, then start the API:

   ```powershell
   corepack pnpm@12.4.1 prisma:validate
   corepack pnpm@12.4.1 start:dev
   ```

`DATABASE_URL` is used by the NestJS runtime; `DIRECT_URL` is used only by Prisma CLI through `prisma.config.ts`.

Optional local PostgreSQL (when Supabase is unavailable): run `docker compose --profile localdb up -d postgres` from the repository root, then set `DATABASE_URL` and `DIRECT_URL` to `postgresql://postgres:postgres@localhost:5433/mobilesocial` (host port 5433, not 5432). Variables set in the shell win over `.env`. Full steps: [docs/handover/cai-dat-va-chay.md](../../docs/handover/cai-dat-va-chay.md).

## Database workflow

The schema is `prisma/schema.prisma`; its migrations are in `prisma/migrations`. Apply them to a database (new or after pulling code) with `corepack pnpm@12.4.1 exec prisma migrate deploy`. Once Dev B and Dev A agree a schema/API change, Dev B creates a new migration with:

```powershell
corepack pnpm@12.4.1 exec prisma migrate dev --name <descriptive-name>
corepack pnpm@12.4.1 prisma:generate
```

Never use `prisma db push`, edit the shared schema in the Supabase Dashboard, edit an applied migration, or commit `.env`.

## Smoke tests

Nine smoke suites in `scripts/*-smoke.cjs` run against a live API. Their prerequisites, accounts and run order are in [docs/handover/cai-dat-va-chay.md](../../docs/handover/cai-dat-va-chay.md) (section 10.3).
