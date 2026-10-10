# MseFunded

Funded MSc and PhD places for materials science and engineering students. Every link checked.

```
msefunded/
  client/   Next.js 16 frontend (App Router, Tailwind 4, shadcn/ui, Motion)
  server/   NestJS 12 REST API
```

## Run it

```bash
npm run install:all
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:3000
```

The frontend runs on built-in sample data until it is told where the API is. To use the API, create `client/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

and restart the client. `NEXT_PUBLIC_*` values are inlined at build time, so rebuild after changing it.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| GET | `/scholarships` | Search. Query: `q`, `level`, `country`, `field`, `funding` (repeatable), `deadline`, `sort`, `page` |
| GET | `/scholarships/count` | Result count for the same query (mobile filter sheet) |
| GET | `/scholarships/featured-ids` | IDs the frontend prerenders at build time |
| GET | `/scholarships/:id` | Listing detail |
| GET | `/scholarships/:id/similar` | Up to three related listings |
| POST | `/scholarships/:id/reports` | Report a problem: `{ reason, details? }` |
| GET | `/stats/landing` | Numbers for the landing page |
| GET | `/me/saved` | The current session's saved list |
| PUT | `/me/saved/:id` | Save (or update) a listing: `{ status?, note?, remindersOn? }` |
| PATCH | `/me/saved/:id` | Update status, note or reminders |
| DELETE | `/me/saved/:id` | Remove from the saved list |
| POST | `/auth/signup` | `{ name, email, password }` |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/logout` | End the session |
| GET | `/auth/me` | Current user |
| GET | `/auth/google` | Not configured yet (returns 501) |

Sessions use an httpOnly cookie. Anything saved before signing in moves to the account on sign-up or login.

## Current limits

- All data is in memory and resets when the server restarts. The listings come from `server/src/shared/data/scholarship-seed.ts`.
- `server/src/shared` is a copy of the frontend's types and search logic so both sides agree on shapes. Move it to a shared package or replace it with a database layer as the backend grows.
- Google sign-in and WhatsApp reminders are not implemented.

## Checks

```bash
npm test        # server end-to-end tests
npm run lint
npm run build
```
