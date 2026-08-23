# ResumeFlow

ResumeFlow is a private resume workspace for shaping experience into a clear, memorable story.

## Live site

The frontend is published on GitHub Pages at:
https://tanvidesale-jlib.github.io/resumeflow/

The repository contains the full pnpm workspace: Vite/React frontend, Express API, PostgreSQL/Drizzle persistence, generated API clients, and Clerk integration.

## Deployment notes

GitHub Pages is static hosting. The frontend build is published in the repository root for the current live deployment. The Express API, PostgreSQL database, and Clerk secret key must run on a server platform; GitHub Pages cannot execute them.

Required variables are documented in .env.example:

- Frontend: VITE_CLERK_PUBLISHABLE_KEY and VITE_CLERK_PROXY_URL
- API server: DATABASE_URL, CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, and PORT

Never commit DATABASE_URL or CLERK_SECRET_KEY.

## Local development

pnpm install
pnpm run typecheck
PORT=4173 BASE_PATH=/resumeflow/ pnpm --filter @workspace/pathfolio run build
