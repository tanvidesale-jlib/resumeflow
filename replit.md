# ResumeFlow

ResumeFlow is a private resume workspace that helps students and early-career professionals shape their experience into a clear, memorable story.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/pathfolio/src/App.tsx` — protected resume editor, welcome screen, templates, preferences, and Clerk routes
- `artifacts/pathfolio/src/index.css` — ResumeFlow visual theme and resume print styles
- `artifacts/api-server/src/routes/resume.ts` — resume API endpoints
- `lib/api-spec/openapi.yaml` — source of truth for resume API contracts
- `lib/db/src/schema/index.ts` — resume persistence schema

## Architecture decisions

- Clerk remains the source of truth for sign-in, sign-up, and user identity.
- Resume presentation preferences are intentionally stored on the device so template, accent, and reading settings feel personal without changing resume data.
- The home route is public for signed-out visitors and sends signed-in users directly to their workspace.

## Product

Users can sign in securely, edit resume basics, experience, education, skills, and projects, preview changes live, choose templates and accents, save their work, print/export it, and adjust workspace preferences.

## User preferences

- Keep the ResumeFlow name and the existing sign-in system when extending the app.
- Keep the interface personal and handmade rather than generic or overly automated.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Run `pnpm run typecheck` after workspace or artifact changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
