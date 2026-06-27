# AI Website Builder

Describe a website in plain English, get a complete, animated, uniquely-designed page back — powered by Google Gemini. Runs live in the browser for anyone, no local AI install required.

---

## How it's wired

```
Browser (React app)
      │  fetch('/api/generate', { prompt })
      ▼
Serverless function (api/generate.js)
      │  holds GEMINI_API_KEY secretly, calls Gemini
      ▼
Google Gemini API → streams HTML back
```

Your Gemini API key **never reaches the browser** — it lives only on the server as an environment variable. This is required: any key shipped in frontend code can be stolen from browser dev tools in seconds.

---

## 1. Get a Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in, click **Create API key**
3. Copy it — you'll paste it into Vercel in step 3 below

The free tier (Gemini 2.5 Flash) is generous enough for personal/small-scale use: ~1,500 requests/day. No credit card needed to start.

---

## 2. Deploy to Vercel (free, ~5 minutes)

### Option A — via GitHub (recommended, auto-deploys on every push)

1. Push this folder to a new GitHub repo
2. Go to [vercel.com/new](https://vercel.com/new), sign in, click **Import** on your repo
3. Vercel auto-detects Vite — leave build settings as default
4. **Before clicking Deploy**, add the environment variable (see step 3 below)
5. Click **Deploy**

### Option B — via CLI (fastest, no GitHub needed)

```bash
npm install -g vercel
cd ai-website-builder
vercel
```

Follow the prompts (link to a new project, accept defaults). It'll deploy once, then:

```bash
vercel --prod
```

for the live production URL.

---

## 3. Set your API key in Vercel

**Dashboard:** Project → Settings → Environment Variables → Add:
- Name: `GEMINI_API_KEY`
- Value: *(paste your key)*
- Environment: Production, Preview, Development (check all three)

**Or via CLI:**
```bash
vercel env add GEMINI_API_KEY
```
Paste the key when prompted, select all environments.

⚠️ **After adding/changing the env var, redeploy** (`vercel --prod` or push a commit) — existing deployments don't pick up new env vars automatically.

---

## 4. You're live

Visit the URL Vercel gives you (e.g. `your-project.vercel.app`). Anyone with the link can now use it — describe a site, watch it generate, no setup on their end.

---

## Local development

```bash
npm install
```

**UI-only work** (no AI calls needed):
```bash
npm run dev
```
Opens at `localhost:5173`. Fine for styling/layout changes, but AI generation will 404.

**Full local testing** (with working AI generation):
```bash
cp .env.example .env
# edit .env, paste your real key
npm run dev:full
```
This runs `vercel dev`, which serves both the frontend AND the `/api/generate` serverless function locally, exactly like production.

---

## Cost control

- Each website generation = 1 Gemini API call (~2,000–6,000 tokens typically)
- Gemini 2.5 Flash free tier: ~1,500 requests/day, no card required
- `api/generate.js` caps prompt length at 60,000 characters as a basic abuse guard
- For a public link expecting real traffic, consider adding rate-limiting per IP (e.g. via [Vercel's Edge Config](https://vercel.com/docs/edge-config) or [Upstash Redis](https://upstash.com)) — not included by default since it adds complexity for a personal project

---

## Project structure

```
api/generate.js         ← serverless function, holds the API key, proxies to Gemini
src/
  ai.js                  ← prompt engineering, streaming client, design DNA system
  App.jsx                ← main app state & logic
  components/            ← UI components
vercel.json              ← deployment config
.env.example              ← template for local dev env var
```

---

## Updating later

Replace any file in `src/` or `api/`, then:
- **GitHub-connected:** just `git push` — Vercel redeploys automatically
- **CLI:** run `vercel --prod` again from the project folder
