-- ============================================================
-- Good Deeds App — Initial Schema
-- ============================================================

-- ── Settings (single row) ───────────────────────────────────
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  school_name text not null default '',
  current_year text,
  global_goal int not null default 100,
  constraint settings_single_row check (true)
);
-- ensure only one row ever exists
create unique index settings_single_row_idx on public.settings ((true));

-- seed the single settings row
insert into public.settings (school_name, current_year, global_goal)
values ('', null, 100);

-- ── Deeds catalog ───────────────────────────────────────────
create table public.deeds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount int not null check (amount between 1 and 10),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Classes ─────────────────────────────────────────────────
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text,
  year text,
  created_at timestamptz not null default now()
);

-- ── Users (mirrors auth.users, stores role) ─────────────────
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'teacher')),
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- ── Teacher → Class access ──────────────────────────────────
create table public.user_class_access (
  user_id uuid not null references public.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  primary key (user_id, class_id)
);

-- ── Students ────────────────────────────────────────────────
create table public.students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index students_class_idx on public.students(class_id);

-- ── Credit events ───────────────────────────────────────────
create table public.credit_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  deed_id uuid not null references public.deeds(id),
  amount int not null check (amount between 1 and 10),  -- snapshot of deed amount
  note text,
  given_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);
create index credit_events_student_idx on public.credit_events(student_id);
create index credit_events_given_by_idx on public.credit_events(given_by);

-- ── Gifts catalog ───────────────────────────────────────────
create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Redemption rounds ───────────────────────────────────────
create table public.redemption_rounds (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  gift_id uuid references public.gifts(id),
  note text,
  redeemed_at timestamptz not null default now(),
  marked_by uuid not null references public.users(id)
);
create index redemption_rounds_class_idx on public.redemption_rounds(class_id);
