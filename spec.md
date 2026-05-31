# Good Deeds — Product Specification

## Prerequisites — Install Before Starting Implementation

> **Do not start coding until these are installed.**

### Required

**1. UI UX Pro Max plugin** — design system generator (color palette, typography, UI style, anti-patterns) tuned for kid-friendly education apps with RTL.

```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

If `/plugin` is not available in your environment, install via CLI in the project root:
```
npm install -g uipro-cli
uipro init --ai claude
```

After install, generate the design system for: *"Hebrew RTL elementary school rewards app for ages 6–11"* and treat the output as the visual baseline (colors, fonts, spacing, effects, anti-patterns).

### Recommended

**2. Supabase CLI** — local migrations, type generation, schema management.
```
brew install supabase/tap/supabase
```

**3. Supabase MCP server** *(optional — only if you want Claude to run SQL directly)*
See: https://github.com/supabase-community/supabase-mcp

### Skills to skip
- `claude-api` skill — not applicable, we're not building an LLM app
- Any `tres-*` plugins — Fireblocks-internal, not relevant here

---


## Overview

**Good Deeds** is a school reward app for an elementary school. Teachers award credits to individual students for performing predefined "good deeds" (e.g. "Helped a classmate" = 2 points, "Cleaned the classroom" = 5 points). The **class collectively** accumulates credits toward a shared goal. When the class total hits the goal, the whole class picks a prize together — the teacher logs it — and the counter resets for the next round.

A public, login-free page per class lets anyone see each student's individual contribution and the class progress bar. **The entire app — public pages, teacher screens, and admin screens — is in Hebrew (RTL)**, available on web and mobile (iOS/Android).

---

## Users & Roles

| Role | Description |
|---|---|
| **Admin** (VP) | Full control over the system — manages classes, students, teachers, gifts, deeds, and settings. **Does not give credits.** |
| **Teacher** | Gives/removes credits to students in **any** class (cross-class allowed, every credit is logged with `given_by`). Manages their assigned class roster, uploads CSV, logs prize redemptions. |
| **Public** | Anyone can view the school home and any class's progress page — no login required |

- No parent access
- Class committees have no system access — they communicate through teachers
- Teachers are invited by the admin via email

---

## Authentication

### Teacher Invite Flow
1. Admin enters teacher's email + name → clicks "Send Invite"
2. Teacher receives an invite email with a one-click link
3. Teacher clicks link → lands on "Set your password" screen → account activated
4. Admin pre-assigns the teacher's class on invite — access is ready on first login

### Login Options
- **Email + password** — standard login
- **Magic link** — teacher enters email, receives a one-click login link (no password needed). Recommended for non-technical staff.
- **Forgot password** — link on login screen → user enters email → Supabase sends reset email → user lands on `/reset-password` and sets a new one

### Email
Starts on Supabase free tier (sent from `noreply@mail.supabase.io`). Can be upgraded to a custom school domain later via SMTP.

### First Admin Bootstrap
The very first admin account cannot be invited (no admin exists yet). Created via a one-time Supabase SQL seed:
- Email: `admin@school.local` (or VP's real email)
- **Password: `admin`** (must be changed on first login)
- Role: `admin`
This is run once during initial Supabase setup (`supabase/seed.sql`).

---

## Core Concepts

### Good Deeds (predefined)
- The admin defines a catalog of **good deeds** — each has a `name` (e.g. "Helped a classmate") and a fixed `amount` (1–10 credits)
- Teachers cannot type free-form amounts. They pick a good deed from the catalog, and the credit value comes from the deed.
- Deeds can be deactivated (not deleted) so historical credit events keep their reference

### Credits
- Teachers give credits to individual students by selecting a good deed → credit amount is taken from the deed (1–10)
- **Any teacher can give credits to any class** (not limited to their assigned class). Every credit event records `given_by` for full audit
- The **class total** = sum of all students' credits in the class since the last redemption
- Credits can be removed by the teacher who gave them, or by the admin — always with a confirmation dialog
- Admin **cannot** give credits directly. Only teachers can.

### Goal
- One global goal for all classes (e.g. 100 credits), set by the admin
- When a class reaches the goal, the teacher logs a prize redemption
- **Phase 1 (no gift catalog yet):** Class total **caps at the goal** (e.g. 100); progress bar is full and a "ממתין למתנה" ("waiting for gift") message is shown. Additional credits are still recorded but the displayed total stays at the goal until the gift catalog ships in Phase 2.

### Prize Redemption
- When the class hits the goal, the teacher sees a celebration and a "Redeem Prize" button
- The class verbally tells the teacher what they want
- Teacher picks from the gift catalog and confirms
- Credits reset to 0 — a new round begins
- Full history of past rounds is preserved

---

## Screens

### Public (no login required)

The public side is a **single flat page** scoped to the **current academic year only** (`settings.current_year`). Past years are not exposed publicly. There is no class page, no student page — just one page that shows everything.

#### `/` — Public Page (single)
- School name (from `settings.school_name`) in header
- For each class in the current year (ordered by class name ascending):
  - Class name + current round progress bar (X / goal, capped at goal)
  - Student rows under the class, sorted by **individual credit total** desc, then **first_name** asc as tiebreaker
  - Each row: student full name + individual credits earned this round (display only — **not clickable**, no drill-down for privacy)
- Empty state if a class has no students: **"אין תלמידים עדיין"** ("No students yet") under that class
- Page is publicly cacheable up to ~10 minutes; live realtime subscription on top so visible viewers see updates without manual refresh

> Student-level credit history (deed names, notes, who gave the credit) is visible to authenticated teachers and admin only — never on the public page.

---

### Authenticated

#### `/login`
- Email + password login
- "Send me a magic link" option (passwordless)
- "Forgot password?" link

#### `/set-password`
- Landing page for teacher invite links
- Teacher sets their password on first login

#### `/reset-password`
- Landing page for forgot-password emails
- User sets a new password

---

### Authenticated App Header

Always visible when logged in:
- **School name** (left / start of RTL row)
- **Active class** name with switcher (teacher only — opens class picker)
- **User display name** + dropdown → **Logout**

### Teacher

#### Class Picker (always available)
- Teachers can give credits to any class — picker lists **all classes**, with the teacher's assigned class(es) highlighted/pinned at the top
- After login, if the teacher has multiple classes assigned → show picker
- Single assigned class → go straight to that class dashboard (still switchable from header)
- No class assigned yet → friendly empty state: **"ממתין לשיוך כיתה על ידי המנהל"** ("Waiting for class assignment by the admin"), but the "All classes" picker is still accessible

#### Dashboard — Class View
- Class progress bar (total credits toward goal)
- Full student list with individual credit totals
- Tap a student → give credit modal

#### Give Credit Modal
- Student name (pre-filled)
- **Good deed selector** — choose from the active deeds catalog (each deed shows name + credit amount)
- Selected deed's amount is shown but not editable
- **Note** (optional free-text field) — context the teacher wants to record (e.g. "עזרה לנועה במתמטיקה")
- Confirm button

#### Credit History (per student)
- List of credit events: deed name, amount, optional note, **given by (`users.display_name`)**, date
- Delete button on own events → "Are you sure?" confirmation modal

#### CSV Upload
- File picker → `.csv` file with columns `first_name`, `last_name` (Hebrew names supported)
- **Preview screen** before import shows:
  - Total rows in the file
  - How many will be imported (new students)
  - How many will be skipped (already exist in the class — matched by `first_name + last_name`, case-insensitive trim)
- Confirm → batch-inserts only the new students

CSV example:
```
first_name,last_name
יוסי,כהן
מיכל,לוי
אור,דוד
```

#### Redemption Flow
- Triggered when class hits the goal (celebration animation shown)
- "Redeem Prize" button → gift catalog
- Teacher selects the gift the class chose
- Confirm → round resets, new round begins

---

### Admin

Admin manages the system. **Admin does not give credits** — only teachers do.

> **UX principle for admin & teacher screens — built for non-technical users (school staff, the VP).**
> - **Plain Hebrew, no jargon** — no "RLS", "UUID", "schema", or English error codes shown to users
> - **Big tap targets**, generous spacing, large readable type — works on a phone held in one hand or a desktop browser
> - **Sensible defaults everywhere** — e.g. new class defaults to current year; new deed defaults to amount 1
> - **Confirm before destructive actions** — delete student, delete class, remove teacher access, delete credit. Always with a clear "האם אתה בטוח?" dialog and the item's name shown
> - **Forgiving flows** — show a toast after every save, with undo where possible (e.g. "התלמיד נמחק. בטל?")
> - **Visible empty states with the next action** — "אין כיתות עדיין. הוסף כיתה ראשונה" with a primary button right there
> - **Friendly error messages** — never expose Supabase/Postgres error text. Map known failures (duplicate email on invite, invalid CSV, network down) to short Hebrew messages
> - **One-screen workflows** — invite a teacher, add a deed, set the school name should each be a single screen with one primary button, not a multi-step wizard
> - **Loading + saving states are explicit** — spinners on buttons during save, skeleton rows while lists load
> - **Search + sort built into every list** — admin tables have a Hebrew search box at the top by default

#### Form fields — required scaffolding

Every form input across the app must include all of:
- **`label`** — short Hebrew label above the field
- **Description / helper text** — short Hebrew sentence under the label explaining *what to enter and why*. Always visible (not just on focus), one line if possible. Examples:
  - שם כיתה: "לדוגמה: ו'1"
  - מטרת נקודות: "המספר שכל כיתה צריכה להגיע אליו לפני קבלת מתנה"
  - שם מעשה טוב: "פעולה שמורה הוא נותן עליה נקודות, למשל 'עזרה לחבר'"
- **Placeholder** — a brief example value (not a substitute for the label)
- **Inline validation message** — below the field, in Hebrew, when invalid (e.g. "נדרש שם", "כתובת אימייל לא תקינה")
- **Required marker** — visible asterisk on required fields with a legend at the top of the form

#### Accessibility — required on every interactive element

- **`accessibilityLabel`** (React Native) / **`aria-label`** (web) on every button, icon-only button, link, and form input that doesn't have a visible text label
- **`accessibilityHint`** / **`aria-describedby`** to point at the helper text for inputs
- **`accessibilityRole`** / semantic HTML — `button`, `link`, `header`, `list`, `listitem`, `dialog` etc. set correctly
- **Visible focus states** on every focusable element (keyboard nav must work end-to-end on web)
- **Color contrast** — minimum WCAG AA (4.5:1 for body text, 3:1 for large text) — must be checked against the design system colors
- **`accessibilityLiveRegion="polite"`** / `aria-live="polite"` on toasts and progress updates so screen readers announce them
- **Modals/dialogs** — focus is trapped inside while open; Escape closes; focus returns to the trigger on close
- **Forms** — submit on Enter where it makes sense; group related radios/checkboxes with a fieldset/legend equivalent
- **Touch targets** — minimum 44×44 pt per Apple HIG / 48×48 dp per Material — even on icon-only buttons
- **Lang attribute** — `<html lang="he" dir="rtl">` on web; correct locale set on native

Admin screens:

#### `/admin/teachers`
- List of all teachers with assigned classes
- "Invite Teacher" form: email + name + class assignment
- Remove teacher access

#### `/admin/classes`
- Create, edit, delete classes — each class has `name`, `grade`, and **`year`** (academic year, optional)
- Assign/reassign teachers to classes
- Filter list by year (default: current year from settings)

#### `/admin/students`
- View/edit students across all classes
- Delete students

#### `/admin/gifts`
- Gift catalog management: add, edit, deactivate gifts
- Each gift: name, description, photo (uploaded to storage)

#### `/admin/deeds`
- Catalog of good deeds: name (Hebrew) + amount (1–10)
- Add, edit, deactivate (no hard delete — preserves history)
- Active deeds are what teachers see in the give-credit modal

#### `/admin/settings`
- School name (shown in app header + invite emails)
- **Current academic year** (e.g. "תשפ״ה" / "2025-2026") — used to filter classes on public home
- Global credit goal (number)

#### `/admin/redemptions`
- Full history of all prize rounds across all classes
- Class name, gift chosen, date, teacher who logged it

#### Admin credit delete
- Admin can delete any credit event in any class (with "Are you sure?" confirmation)

---

## Technical Stack

### Frontend (single Expo codebase — web + iOS + Android)

| Concern | Library | Version | Why |
|---|---|---|---|
| Framework | **Expo** | `~55.0.13` | One codebase for web + native |
| Routing | **`expo-router`** | `~55.0.13` | File-based routing, works on web and native |
| Language | **TypeScript** | `~5.9.2` | Type safety throughout |
| Styling | **NativeWind v4** + **Tailwind CSS v3** | `^4.2.3` + `^3.4.19` | NativeWind v4 requires Tailwind v3 (not v4) |
| Components | **`react-native-reusables`** (shadcn-style for RN+Web) | — | Ready-made dialogs, dropdowns, inputs — used for admin tables/forms |
| Forms | **`react-hook-form`** + **`zod`** | `^7.73` + `^4.3` | Performant forms with schema validation |
| Tables | **`@tanstack/react-table`** | `^8.21` | Headless table logic for admin lists |
| Dates | **`moment`** + Hebrew locale (`moment/locale/he`) | `^2.30` | Date formatting and parsing |
| Toasts | **`sonner-native`** | `^0.24` | Non-blocking notifications |
| i18n / RTL | **`i18next`** + `react-i18next` + explicit RTL (`row-reverse`, `#root` direction) | `^26` + `^17` | Hebrew translations + RTL layout |
| CSV parsing | **`papaparse`** + `@types/papaparse` | `^5.5` | Robust CSV parsing in the browser/native |
| File picker | **`expo-document-picker`** | `~55.0.13` | CSV file selection |
| Image picker | **`expo-image-picker`** | Phase 2 only — not yet installed | Gift image upload |
| Icons | **`lucide-react-native`** | `^1.8` | Consistent icon set across web/native |
| Animations | **`react-native-reanimated`** + **`react-native-worklets`** | `4.2.1` + `^0.8` | Goal-hit celebration; worklets required by reanimated v4 |
| Web support | **`react-dom`** + **`react-native-web`** | `^19.2` + `^0.21` | Required for Expo web target |

> **Note:** `expo-linking` and `expo-constants` are also installed as required peer deps of `expo-router`.

### Backend

| Concern | Service | Notes |
|---|---|---|
| API + DB | **Supabase** (PostgreSQL) | Auto-generated REST + Realtime APIs from schema |
| Auth | **Supabase Auth** | Email/password, magic link, invite, password reset — all built in |
| Access control | **Supabase RLS** | Row Level Security policies live in the DB |
| Realtime | **Supabase Realtime** | WebSocket subscriptions on table changes |
| File storage | **Supabase Storage** | Public bucket for gift images |
| Server logic | **Supabase Edge Functions** (Deno) | Phase 3 — push notifications on goal hit |
| Client SDK | **`@supabase/supabase-js`** | Used directly from the Expo app |

No separate server (no Express/Node/Django). The Expo app talks directly to Supabase.

### Project Setup & Tooling

| Concern | Decision |
|---|---|
| **Package manager** | `npm` with a project-level `.npmrc` pointing at `https://registry.npmjs.org/` and `min-release-age=0` — overrides Fireblocks' internal JFrog registry |
| **Env vars** | `EXPO_PUBLIC_` prefix (not `NEXT_PUBLIC_`) — Expo's convention for public env vars. Stored in `.env` (gitignored). `.env.example` committed as a template |
| **Supabase MCP** | Configured in `.mcp.json` via `claude mcp add --scope project --transport http supabase` — allows Claude to run SQL directly against the project |
| **Supabase agent skills** | Installed via `npx skills add supabase/agent-skills` — adds Postgres best practices + Supabase-specific skills to `.agents/skills/` |
| **Tailwind** | Must stay on **v3** — NativeWind v4 does not support Tailwind v4 |
| **Metro config** | `metro.config.js` using `withNativeWind(config, { input: './global.css' })` |
| **Entry point** | `index.ts` → `import 'expo-router/entry'` (replaces default Expo entry) |

### Architecture

```
┌─────────────────────────────────┐
│  Expo App (Web + iOS + Android) │
│  one codebase, expo-router      │
└────────────┬────────────────────┘
             │ supabase-js
             ▼
┌─────────────────────────────────┐
│           Supabase              │
│  Auth · DB+RLS · Realtime ·     │
│  Storage · Edge Functions       │
└─────────────────────────────────┘
```

---

## Database Schema

```sql
-- Global settings (single row)
settings (
  id,
  school_name TEXT,
  current_year TEXT,    -- the active academic year; public home filters classes to this
  global_goal INT DEFAULT 100
)

-- Predefined good deeds catalog
deeds (
  id,
  name TEXT,           -- Hebrew, e.g. "עזרה לחבר"
  amount INT,          -- 1–10, CHECK constraint
  is_active BOOLEAN DEFAULT true,
  created_at
)

-- School classes
classes (
  id,
  name,
  grade,
  year TEXT,         -- academic year, e.g. "תשפ״ה" / "2025-2026"; nullable
  created_at
)

-- Authenticated users (teachers + admin)
users (
  id,           -- matches auth.uid()
  email,
  role,         -- 'admin' | 'teacher'
  display_name,
  created_at
)

-- Which classes a teacher can manage
user_class_access (
  user_id,
  class_id
)

-- Students
students (
  id,
  first_name,
  last_name,
  class_id,
  created_at
)

-- Individual credit events (full audit log of every credit given)
credit_events (
  id,
  student_id,
  deed_id,           -- references deeds(id)
  amount INT,        -- snapshot of deed.amount at time of event;
                     -- preserved so editing a deed's amount later does not change history
  note TEXT,         -- optional free-text note added by the teacher when giving the credit
  given_by,          -- user_id of the teacher who gave the credit (cross-class allowed)
  created_at
)

-- Completed prize rounds (one row per redemption)
redemption_rounds (
  id,
  class_id,
  gift_id,
  note TEXT,
  redeemed_at,
  marked_by     -- user_id
)

-- Gift catalog
gifts (
  id,
  name,
  description,
  image_url,
  is_active
)
```

### Credit Reset Logic
Class total for current round = `SUM(credit_events.amount)` for students in the class where `credit_events.created_at > last redemption_rounds.redeemed_at`. No data is deleted on reset — full history is preserved.

### RLS Summary
| Table | Public SELECT | Teacher INSERT | Teacher DELETE | Admin |
|---|---|---|---|---|
| `students`, `classes` | ✅ | — | — | Full |
| `credit_events` | ✅ | **Any class** (`role = teacher`) — `given_by` must equal `auth.uid()` | Own events only (`given_by = auth.uid()`) | DELETE only (no INSERT) |
| `redemption_rounds` | ✅ | Any teacher | — | Full |
| `gifts`, `deeds` | ✅ (active only) | — | — | Full |
| `settings` | ✅ | — | — | UPDATE |

---

## Delivery Process

**Section gate — test before moving on.** After completing each section/feature, the implementation must be verified end-to-end before starting the next section. No "I'll fix it later" — if it doesn't work, finish the current section first.

For each section the gate includes (whichever apply):
- App builds with no TypeScript errors
- Relevant page loads on web (`npx expo start --web`)
- Hebrew/RTL renders correctly
- The section's primary user flow runs through without errors (e.g. CSV upload → preview → import → student appears in list)
- Supabase RLS behaves as specified (unauthenticated cannot do what only authenticated should)
- Realtime updates land where the spec says they should

Only after these pass do we move on.

---

## Delivery Phases

### Phase 1 — Core
- Supabase schema, RLS, credit reset logic
- Public homepage (school name + class list) and class page with realtime progress
- Teacher invite flow (email → set password)
- Teacher login (password + magic link + forgot password)
- Class picker for multi-class teachers; empty state for unassigned teachers
- Give credit (via good deeds catalog) / delete credit flows
- CSV student upload with duplicate-skip preview
- Admin: school settings (name + goal), classes, students, teachers, **deeds catalog**

### Phase 2 — Gifts & Redemption
- Gift catalog (admin CRUD with image upload)
- Redemption flow + goal celebration animation
- Redemption history screen

### Phase 3 — Polish
- Admin analytics (credits per class, redemption history charts)
- Push notifications via Expo + Supabase Edge Functions (when class hits goal)
- Custom school email domain (upgrade to Supabase Pro + SMTP)
