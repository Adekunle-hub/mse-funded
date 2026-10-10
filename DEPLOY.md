# Deploying MseFunded for free

| Part | Service | Address |
|---|---|---|
| Website | Vercel | https://msefunded.orbgnost.com |
| API | Render (free) | https://api.msefunded.orbgnost.com |
| Database | Neon (free Postgres) | private |
| Redis for the API | Upstash (free) | private |
| Background jobs | GitHub Actions (free for public repos) | runs on a timetable |

All five sign in with GitHub. None of them needs a card.

Your private values live in `.env.production` at the project root (git ignores it). Open it in your editor when a step says "from .env.production".

## 1. Database: Neon
1. Go to neon.tech, sign in with GitHub, create a project. Region: **Europe (Frankfurt)**.
2. Copy the **connection string** (it starts with `postgresql://` and ends with `sslmode=require`).
3. Paste it into `.env.production` as `DATABASE_URL=...`.
4. Tell Claude. It copies your existing listings and data into Neon, so nothing has to be crawled or read again.

## 2. Redis: Upstash
1. Go to upstash.com, sign in with GitHub, create a **Redis** database. Region: **Frankfurt**. Plan: **Free**.
2. Copy the URL that starts with `rediss://` into `.env.production` as `REDIS_URL=...`.

## 3. API: Render
1. Go to render.com, sign in with GitHub, choose **New > Blueprint**, and pick the `mse-funded` repo. Render reads `render.yaml`.
2. Fill in the values it asks for:
   - `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `REVALIDATE_SECRET`: from `.env.production`
   - `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: from `server/.env`
3. Click **Apply**. The first build takes a few minutes. Open `https://<your-service>.onrender.com/health`; it should say `"status":"ok"`.
4. In the service, open **Settings > Custom Domains** and add `api.msefunded.orbgnost.com`. Render shows the record to create in step 5.

## 4. Website: Vercel
1. In your Vercel project, open **Settings > General** and set **Root Directory** to `client`.
2. Open **Settings > Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL` = `https://api.msefunded.orbgnost.com`
   - `NEXT_PUBLIC_SITE_URL` = `https://msefunded.orbgnost.com`
   - `REVALIDATE_SECRET` = the value from `.env.production`
3. Open **Settings > Domains** and add `msefunded.orbgnost.com`. Vercel shows the record to create in step 5.
4. Redeploy only after the API is live (step 3), because the website build reads listings from the API.

## 5. Domain records
In Namecheap open **Domain List > orbgnost.com > Manage** and look at **Nameservers**.
- If it says **Namecheap BasicDNS**, add the records under **Advanced DNS**.
- If it says **Custom DNS** with `googledomains.com` servers, the records are managed where those point. Tell Claude and it will help you find the right place.

Add the two records Render and Vercel showed you (both are `CNAME` records):

| Host | Points to |
|---|---|
| `api.msefunded` | the Render address from step 3 |
| `msefunded` | the Vercel address from step 4 |

## 6. Background jobs: GitHub
In the GitHub repo open **Settings > Secrets and variables > Actions > New repository secret** and add:
- `DATABASE_URL`, `JWT_SECRET`, `REVALIDATE_SECRET`: from `.env.production`
- `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`, `RESEND_API_KEY`: from `server/.env`

Then open **Actions > Background jobs > Run workflow** once to test it.

The timetable (Lagos time):

| When | Job |
|---|---|
| Every 3 hours | crawl, read with Claude, verify |
| 05:00 | re-check live listings |
| 06:00 | discover new pages |
| 08:00 | deadline reminders, then clean up old page copies |

GitHub pauses scheduled jobs if the repo has no commits for 60 days. Any commit restarts them.

## 7. Google sign-in
In Google Cloud Console open **APIs & Services > Credentials > your OAuth client** and add this to **Authorized redirect URIs**:
`https://api.msefunded.orbgnost.com/auth/google/callback`

## 8. Make yourself admin
Sign up on the live site, then tell Claude your email.

## Optional: keep the API awake
Render's free API sleeps after 15 minutes without visitors, and the next visitor waits 30 to 60 seconds. A free monitor at uptimerobot.com that opens `https://api.msefunded.orbgnost.com/health` every 5 minutes keeps it awake. Check Render's current terms before relying on this.
