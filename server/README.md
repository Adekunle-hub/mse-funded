# MseFunded API

NestJS 12 REST API for the MseFunded frontend in `../client`. See the root README for the endpoint list.

```bash
npm install            # also generates the Prisma client (postinstall)
cp .env.example .env   # then set DATABASE_URL to your local Postgres
npm run db:migrate     # create/update tables
npm run db:seed        # load the 15 sample listings
npm run start:dev
```

Database commands: `db:migrate` (new migration in development), `db:deploy` (apply migrations in production), `db:seed` (sample listings and crawl sources), `db:studio` (browse data). The crawler runs every 15 minutes while the API is up and discovery runs daily at 06:00 (needs a free `TAVILY_API_KEY`); `npm run build` then `npm run crawl` (queues every due source and waits for the worker) or `npm run discover` runs either once. Crawling runs through BullMQ on Redis (`REDIS_URL`, Memurai on Windows): one job per source, retries for temporary failures, and each new page is queued for extraction. Live listings are re-checked daily at 05:00 (`npm run recheck` runs it once): dead official links are taken down and the checked date is refreshed. API docs are at `/docs` outside production. Public reads (search, details, stats, health) are not rate-limited because the website calls them from its own server; reports are limited to 5 a minute and login or sign-up to 10. Make your account an admin with `npm run make-admin -- you@example.com` (after `npm run build`); admins see an Admin link and `/admin`. Password reset emails go through Resend (`RESEND_API_KEY`, `EMAIL_FROM`); until a domain is verified in Resend, it can only send to your own Resend account email. Google sign-in uses `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; add `<API_URL>/auth/google/callback` (for example http://localhost:5000/auth/google/callback) to the OAuth client's authorized redirect URIs. Deadline reminders: every day at 08:00 Lagos time, students get one email when a saved scholarship is 7, 3 or 1 day from closing (`npm run remind` runs it once). Each email has a signed one-click link to stop reminders for that scholarship. The schema is in `prisma/schema.prisma`; the client is generated into `src/generated/prisma` (git-ignored).

```
src/
  config/         environment validation
  prisma/         PrismaService (global)
  health/         GET /health
  users/          user records
  auth/           sign up, log in, refresh, log out (bcrypt, JWT access + refresh cookies)
  scholarships/   search, detail, similar, reports, landing stats
  saved/          a signed-in user's saved list
  sources/        websites we collect listings from and when they are due
  crawler/        downloads due sources politely (robots.txt, timeouts) into raw pages; listing pages add their post links as sources
  discovery/      daily web searches (Tavily) that add new pages as sources
  extraction/     Claude reads each new page: Haiku 5.5 screens for relevance, Opus 5.5 extracts opportunities into ExtractedOpportunity; token usage in LlmUsage
  verification/   filters, de-duplicates and checks listings (Step 7)
  notifications/  emails through Resend: password reset and deadline reminders (7, 3 and 1 day before)
  shared/         types, sample listings and search logic shared with the frontend
prisma/
  schema.prisma   sources, raw pages, scholarships, users, refresh tokens, saved items, reminders
  migrations/     SQL migrations (committed)
  seed.ts         loads the sample listings
```

```bash
npm run test:e2e
npm run lint
npm run build && npm run start:prod
```
