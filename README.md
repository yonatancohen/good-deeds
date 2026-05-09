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

## Mobile testing via Expo Go

```bash
npm start
```

A QR code prints. Open Expo Go on your phone and scan it. Works on iOS and Android — no separate build needed for daily testing.

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
