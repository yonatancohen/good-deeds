# Good Deeds (תפסתי אותך בטוב)

A Hebrew (RTL) school rewards app. Teachers award credits to students for predefined "good deeds"; the class accumulates credits collectively toward a shared goal, and when the goal is hit, the whole class picks a prize. A public, login-free page shows each class's progress.

Single Expo codebase → web + iOS + Android. Backend on Supabase.

## Stack

- **Frontend:** Expo + expo-router + TypeScript + NativeWind v4 (Tailwind v3) + react-hook-form + zod
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage, RLS)
- **i18n:** i18next (Hebrew only)
- **Web hosting:** Vercel (free tier)
- **Mobile delivery:** Expo Go + EAS Update (free tier)

## Links

| | |
|---|---|
| Web app | (see Vercel dashboard → Deployments) |
| Vercel project | https://vercel.com/yonatancohens-projects/good |
| EAS project | https://expo.dev/accounts/yonico86/projects/good-deeds |
| GitHub repo | https://github.com/yonatancohen/good-deeds |
| Spec | [spec.md](./spec.md) |
| Deploy guide | [DEPLOY.md](./DEPLOY.md) |

## Setup (once per machine)

```bash
cp .env.example .env
# fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

npm install
```

`.npmrc` enforces `min-release-age=21` (only install package versions at least 21 days old) and pins the registry to public npm to bypass the work-computer JFrog mirror.

## Day-to-day

| Task | Command |
|---|---|
| Run web dev locally | `npm run web` |
| Run mobile dev locally | `npm start` → scan QR with Expo Go |
| Ship web changes | `git push` (Vercel auto-builds on every push to `main`) |
| Build web locally (sanity check) | `npm run build:web` → output in `dist/` |
| Ship a mobile OTA update (preview) | `./node_modules/.bin/eas update --branch preview --message "..."` |
| Ship a mobile OTA update (production) | `./node_modules/.bin/eas update --branch production --message "..."` |
| Ship everything at once (preview) | `npm run deploy:all` |
| Ship everything at once (production) | `npm run deploy:all:prod` |

## Mobile — full guide

### TL;DR — what to run when

| You want to… | Command | Who can see it |
|---|---|---|
| Test on your own phone while coding | `npm start` then scan QR | Only your phone (same Wi-Fi as your Mac) |
| Share with one person for quick review | `npm start -- --tunnel` then send the QR / URL | Anyone with the URL, while your Mac is on |
| Share a stable preview link with the school VP | `eas update --branch preview --message "…"` | Anyone with the project's Expo Go URL |
| Push a fix to all teachers running production | `eas update --branch production --message "…"` | Everyone running the production build |
| Build a real installable Android APK | `eas build --platform android --profile preview` | Anyone you give the APK link to |

### Concepts (read this once)

**Branch.** A named, ordered stack of OTA updates. We have two: `preview` and `production`. Each `eas update --branch <name>` adds a new entry to the top of that stack. Phones fetch the latest entry on next launch.

**Channel.** What a build subscribes to. In `eas.json` we have `build.preview.channel: "preview"` and `build.production.channel: "production"`. A build on the `preview` channel pulls from the `preview` branch; same for production. Channels can be re-pointed in the dashboard ("promote preview to production") without rebuilding.

**runtimeVersion.** Set to `{ "policy": "appVersion" }` in `app.json`. Every OTA update is tagged with the runtime version. Phones only fetch updates whose runtime matches the app they're running. So:
- Pure JS/TS changes → `eas update` is enough.
- Adding a native module, bumping Expo SDK, changing `app.json` permissions → bump `expo.version` in `app.json` and do a fresh `eas build`. OTA updates after that won't reach old builds.

**Expo Go vs. Development Build vs. Standalone build.**
- **Expo Go** — Expo's pre-built host app on the App Store / Play Store. Loads any project's JS bundle. Free, no Apple/Google account needed, but limited to packages Expo Go ships with (most common ones, including ours).
- **Development build** — your own custom version of Expo Go, includes your project's native modules. Needed only if you add a native dependency Expo Go doesn't ship.
- **Standalone build (`eas build`)** — a real `.apk` / `.ipa` that runs without Expo Go.

For this project, **Expo Go is enough**. None of our deps require a custom dev client.

### Day-to-day: dev on your own phone

```bash
cd /Users/ycohen/Project/good
npm start
```

A QR prints. On your phone:
1. Install Expo Go (App Store / Play Store) once.
2. iOS: open the Camera app → scan QR → tap the banner. Android: open Expo Go → tap "Scan QR Code".
3. App loads, hot-reloads on every save.

If your phone isn't on the same Wi-Fi (or Wi-Fi blocks peer connections), use tunnel mode — slower but works anywhere:

```bash
npm start -- --tunnel
```

### Sharing a preview with someone (no install of Xcode/Android Studio needed for them)

After running:

```bash
./node_modules/.bin/eas update --branch preview --message "first build for review"
```

EAS prints a permalink for that specific update. The stable URL for **always-latest preview** of this project is:

```
https://expo.dev/preview/update?channel-name=preview&runtime-version=exposdk:54.0.0&appScheme=exp+good-deeds&projectId=90100a76-6a01-41ca-8407-c39174787046
```

Send that to the reviewer. They:
1. Install Expo Go on their phone.
2. Open the URL on their phone (tap the link in WhatsApp, email, etc.).
3. The link opens Expo Go and loads the latest `preview` update.

Project page on Expo (lists every update, lets the reviewer pick a specific one): **https://expo.dev/accounts/yonico86/projects/good-deeds**

### `eas update` parameters explained

```bash
./node_modules/.bin/eas update --branch <name> --message "<text>"
```

| Flag | What it does |
|---|---|
| `--branch <name>` | Required. Which branch to publish to. Use `preview` for staging/review, `production` for end users. |
| `--message "<text>"` | Required. Free-text label shown in the Expo dashboard and `eas update:list`. Treat it like a commit message. |
| `--platform <ios\|android\|all>` | Optional. Default `all`. Only publish for one platform if you only changed something platform-specific. |
| `--auto` | Skip prompts; uses the current branch name and last git commit message. Handy for CI. |
| `--non-interactive` | Fail rather than prompt. Use in scripts. |

Examples:

```bash
# Push to preview with a custom note
./node_modules/.bin/eas update --branch preview --message "Fix Hebrew RTL spacing in header"

# Push to production using the last git commit message
./node_modules/.bin/eas update --branch production --message "$(git log -1 --pretty=%s)"

# Auto: branch = current git branch name, message = last commit
./node_modules/.bin/eas update --auto
```

### How to publish to **preview** (the safe channel)

Use this whenever you want to share a build for review without affecting end users.

```bash
cd /Users/ycohen/Project/good

# Make sure your changes are committed (optional but recommended for clean traceability)
git status
git add -A && git commit -m "What changed"
git push

# Publish the OTA update
./node_modules/.bin/eas update --branch preview --message "Short description of what's new"
```

Anyone with the preview URL above (or browsing the Expo project page) sees the new version on next Expo Go launch.

### How to publish to **production** (everyone running the prod build)

```bash
cd /Users/ycohen/Project/good

# Strongly recommended: ship the same commit you tested in preview
git push                                                  # if not already pushed

# Publish to production
./node_modules/.bin/eas update --branch production --message "Release notes here"
```

Production updates roll out to **every** phone running the production build on next launch. There's no staged rollout on the free tier — ship something you've already tested in preview.

To roll back: dashboard → Updates → find the previous production update → "Republish". The older bundle becomes the latest, phones get it on next launch.

### Promote preview → production (no rebuild)

You can repoint the production channel at the preview branch from the Expo dashboard:
- Project → Channels → `production` → "Update branch mapping" → choose `preview`.
This is how you ship the exact bundle you tested without re-running `eas update`.

### Building a real installable APK (Android, free) — when you're ready

`.apk` is a standalone Android app. Teachers install it directly without Expo Go.

```bash
./node_modules/.bin/eas build --platform android --profile preview
```

EAS builds it on their servers (free tier: 30 builds / month). When done, EAS prints a download URL — share that. Teachers tap it on their phone, allow "Install from unknown sources" once, install, and the app appears on their home screen.

### Building for iOS (later, requires Apple Developer Program — $99/yr)

```bash
./node_modules/.bin/eas build --platform ios --profile preview
```

For internal distribution this goes through TestFlight (requires the $99/yr Apple account). Without it, iPhone users have to use Expo Go.

### Sharing URL summary (copy-pasteable)

| What | URL |
|---|---|
| **Preview app on Expo Go** (latest preview build) | `https://expo.dev/preview/update?channel-name=preview&runtime-version=exposdk:54.0.0&appScheme=exp+good-deeds&projectId=90100a76-6a01-41ca-8407-c39174787046` |
| **Production app on Expo Go** (latest prod build) | `https://expo.dev/preview/update?channel-name=production&runtime-version=exposdk:54.0.0&appScheme=exp+good-deeds&projectId=90100a76-6a01-41ca-8407-c39174787046` |
| **Expo project dashboard** (all updates, channels, branches) | https://expo.dev/accounts/yonico86/projects/good-deeds |
| **Web app** | (your Vercel deploy URL) |

> Replace `exposdk:54.0.0` with the actual SDK version if you ever upgrade Expo SDK. Find the current version with `node -p "require('./node_modules/expo/package.json').version"`.

## Environment variables

| Var | Set in |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` locally; Vercel env vars in prod |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` locally; Vercel env vars in prod |

The `EXPO_PUBLIC_` prefix is required — Expo only exposes vars with that prefix to the client bundle.

## Project structure

```
app/                expo-router pages (file-based routes)
  admin/            admin screens (manage classes, students, teachers, deeds, gifts, settings)
  teacher/          teacher screens (give credits, CSV upload, redemption)
  auth/             login, set password, reset password
components/         shared UI components
hooks/              custom hooks
lib/                Supabase client, helpers, i18n
design-system/      colors, typography, tokens
supabase/migrations/  SQL migrations (schema, RLS, seed)
scripts/            deploy scripts
```

## Tech notes

- **No `npx` in build commands.** `npx expo install <package>` silently rewrites `package.json` to whatever Expo currently recommends — that breaks the 21-day rule. All scripts use the locally-installed binaries from `./node_modules/.bin/`.
- **expo-updates pinned exactly** (`29.0.16`) — same reason; Expo's "smart installer" tends to pick the freshest version, which is too new for our policy.
- **NativeWind v4 requires Tailwind v3.** Don't bump to Tailwind v4.

## License

Private — internal school tool.
