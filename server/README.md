# MseFunded API

NestJS 12 REST API for the MseFunded frontend in `../client`. See the root README for the endpoint list.

```bash
npm install
cp .env.example .env   # optional; defaults to port 4000 and http://localhost:3000
npm run start:dev
```

```
src/
  scholarships/   search, detail, similar, reports, landing stats
  saved/          the saved list for the current session
  auth/           sign up, log in, log out (in-memory users, scrypt hashes)
  session/        httpOnly session cookie
  shared/         types, sample listings and search logic shared with the frontend
```

```bash
npm run test:e2e
npm run lint
npm run build && npm run start:prod
```
