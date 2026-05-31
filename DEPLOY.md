# Deployment Guide — Good Deeds (תפסתי אותך בטוב)

This project ships in three places, all on free tiers:

| Piece            | Service       | Cost  |
| ---------------- | ------------- | ----- |
| Backend (DB+Auth+Realtime+Storage) | Supabase free  | $0    |
| Web app          | Vercel free   | $0    |
| Mobile (iOS+Android) | Expo Go + EAS Update | $0 |

---

## 0 — One-time prerequisites

You need accounts on:

1. **Supabase** — already set up (project URL + anon key in `.env`)
2. **Vercel** — free, sign up at https://vercel.com
3. **Expo** — free, sign up at https://expo.dev

You also need on your machine:

- Node 20+ and npm
- Expo Go app installed on your phone (App Store / Play Store) for mobile testing

---

## 1 — One-time setup (run once per machine)

```bash
npm install --legacy-peer-deps
npm run deploy:setup
```

The `deploy:setup` script will:

1. Verify `.env` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Install `vercel` and `eas-cli` globally
3. Log you in to Vercel (browser opens)
4. Link this folder to a Vercel project
5. Push your Supabase env vars to Vercel (production + preview)
6. Log you in to Expo
7. Initialize the EAS project (writes `projectId` into `app.json`)
8. Create the `production` and `preview` OTA channels

After it finishes, **commit the changes** (Vercel writes `.vercel/project.json` — already gitignored — and EAS writes the `projectId` into `app.json` which you do want committed).

```bash
git add app.json
git commit -m "Wire up EAS projectId"
```

---

## 2 — Deploy the web app to Vercel

### Option A — Vercel CLI (fastest, no GitHub needed)

```bash
npm run deploy:web        # preview deploy → unique URL like good-deeds-abc123.vercel.app
npm run deploy:web:prod   # production deploy → your main *.vercel.app URL
```

The build runs `npx expo export -p web` and Vercel serves the resulting `dist/` folder.
Routing is rewritten so `expo-router` deep links work (everything that isn't a static asset falls back to `index.html`).

### Option B — GitHub auto-deploy (recommended for ongoing work)

1. Push the repo to GitHub.
2. In Vercel dashboard → **Add New Project** → import the GitHub repo.
3. Vercel auto-detects `vercel.json`. Confirm and deploy.
4. **Add the env vars** in Vercel dashboard → Project → Settings → Environment Variables:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_SITE_URL` (production URL, for teacher invite email links)
   - (All three, for Production + Preview only — not Development; use Preview for local `vercel dev` testing)
5. From now on, every `git push` to `main` auto-deploys to production. Every `git push` to a branch creates a preview URL.

> If you ran `npm run deploy:setup` first, the env vars are already pushed via CLI — you can skip step 4.

### Custom domain (optional)

Vercel dashboard → Project → Settings → Domains → add your domain and follow the DNS instructions. HTTPS is automatic.

---

## 3 — Mobile testing via Expo Go

For day-to-day testing during development:

```bash
npm start
```

A QR code prints. Open **Expo Go** on your phone and scan it. The app loads instantly.
Both you and the phone need to be on the same Wi-Fi (or use tunnel mode: `npm start -- --tunnel`).

> Teachers don't need a separate build for this — they install Expo Go from their app store and scan the QR you share with them.

---

## 4 — Push mobile updates over the air (EAS Update)

Once teachers are running the app via Expo Go (or a future standalone build), you can push JS-only updates instantly without rebuilding:

```bash
npm run eas:update         # publishes to the 'preview' channel
npm run eas:update:prod    # publishes to the 'production' channel
```

Phones fetch the new JS on next app launch (or in-session if you wire `expo-updates` checks).

---

## 5 — Deploy everything in one command

```bash
npm run deploy:all          # web preview + EAS preview
npm run deploy:all:prod     # web production + EAS production
```

This is what you'll run after a feature is ready: it deploys the web build to Vercel and pushes an OTA update to mobile in one shot.

---

## Environment variables reference

| Var | Where it's used | Where it's set |
|-----|-----------------|----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Expo app (web + native) | `.env` locally, Vercel env vars in prod |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Expo app (web + native) | `.env` locally, Vercel env vars in prod |
| `EXPO_PUBLIC_SITE_URL` | Auth email redirect links | `.env` locally, Vercel env vars in prod |

> The `EXPO_PUBLIC_` prefix is required — it's how Expo exposes vars to the client bundle.
> Never put secrets here — only the public anon key. Server-only secrets stay on Supabase.

---

## Troubleshooting

**`vercel` build fails with "module not found"**
Run `npm install --legacy-peer-deps` locally first to confirm deps install. The `vercel.json` already uses `--legacy-peer-deps`.

**Hebrew text shows as boxes / fonts wrong**
Confirm Google Fonts (`@expo-google-fonts/baloo-2` and `@expo-google-fonts/nunito`) are loaded in your root layout. They bundle automatically.

**EAS Update push succeeds but phones don't see it**
The phone must be running a build with the matching `runtimeVersion`. In Expo Go that's automatic; in a standalone build, only updates with the same runtime version land. Bumping native deps requires a new build.

**Vercel deploy succeeds but page is blank**
Open browser devtools — most likely env vars aren't set on Vercel. Re-run `npm run deploy:setup` or set them manually in the Vercel dashboard.

**iOS / Android standalone builds**
Expo Go is enough for a single school. If you ever want real installable apps, see Apple Developer Program ($99/yr) and Google Play ($25 once). Build with `eas build -p ios --profile production` or `eas build -p android --profile production`.

---

## Teacher invite emails (Supabase Auth)

When an admin invites a teacher, the app creates the user and asks Supabase to send a **password setup** email. If teachers never receive mail, check these in order:

### 1. Redirect URLs (required)

Supabase Dashboard → **Authentication** → **URL Configuration**

| Field | Example |
| ----- | ------- |
| **Site URL** | `https://good-omega-three.vercel.app` |
| **Redirect URLs** | `https://good-omega-three.vercel.app/**` |
| Local dev | `http://localhost:8081/**` (or your Expo web port) |

The invite link must land on `/auth/set-password` on your deployed site. Without allowlisted redirect URLs, Supabase may accept the API call but **not send** email, or the link in the email will be rejected.

Set the same origin in Vercel env:

```bash
EXPO_PUBLIC_SITE_URL=https://good-omega-three.vercel.app
```

### 2. Confirm email setting

**Authentication** → **Providers** → **Email**

- If **Confirm email** is **ON**: the teacher gets a **confirmation** email from `signUp`, not a separate “set password” mail. They must click that link first. The admin UI explains this in the success alert.
- For the simpler flow (one “set your password” email), turn **Confirm email** **OFF**, then invite again.

### 3. Email delivery (spam / SMTP)

Default mail is sent from `noreply@mail.supabase.io` (free tier has rate limits). Ask teachers to check **spam**. For production, configure **Custom SMTP** under **Project Settings** → **Authentication** (or use a school domain on Supabase Pro).

### 4. Auth logs

**Authentication** → **Logs** — look for `user.signup`, `user.recovery`, or errors when you invite.

### 5. Teacher already exists

Re-inviting the same email sends a **password recovery** email instead of creating a duplicate user. If the teacher still cannot log in, use **Forgot password** on the login screen (after redirect URLs are fixed).

---

## Quick reference

```bash
# First time on a machine
npm install --legacy-peer-deps
npm run deploy:setup

# Day-to-day
npm start                  # mobile dev via Expo Go QR
npm run web                # web dev locally

# Ship
npm run deploy:web         # web preview
npm run deploy:web:prod    # web production
npm run eas:update         # mobile OTA preview
npm run eas:update:prod    # mobile OTA production
npm run deploy:all:prod    # everything, production
```
