-- ============================================================
-- Good Deeds App — Row Level Security Policies
-- ============================================================

-- Helper: check if caller is admin
create or replace function public.is_admin()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: check if caller is a teacher (any role that is authenticated)
create or replace function public.is_teacher()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- ── Enable RLS on all tables ─────────────────────────────────
alter table public.settings enable row level security;
alter table public.deeds enable row level security;
alter table public.classes enable row level security;
alter table public.users enable row level security;
alter table public.user_class_access enable row level security;
alter table public.students enable row level security;
alter table public.credit_events enable row level security;
alter table public.gifts enable row level security;
alter table public.redemption_rounds enable row level security;

-- ── settings ────────────────────────────────────────────────
create policy "settings: public read"
  on public.settings for select using (true);

create policy "settings: admin update"
  on public.settings for update using (public.is_admin());

-- ── deeds ────────────────────────────────────────────────────
create policy "deeds: public read active"
  on public.deeds for select using (true);

create policy "deeds: admin full"
  on public.deeds for all using (public.is_admin());

-- ── classes ──────────────────────────────────────────────────
create policy "classes: public read"
  on public.classes for select using (true);

create policy "classes: admin full"
  on public.classes for all using (public.is_admin());

-- ── users ────────────────────────────────────────────────────
create policy "users: authenticated read"
  on public.users for select using (auth.uid() is not null);

create policy "users: admin full"
  on public.users for all using (public.is_admin());

-- ── user_class_access ────────────────────────────────────────
create policy "user_class_access: authenticated read"
  on public.user_class_access for select using (auth.uid() is not null);

create policy "user_class_access: admin full"
  on public.user_class_access for all using (public.is_admin());

-- ── students ─────────────────────────────────────────────────
create policy "students: public read"
  on public.students for select using (true);

create policy "students: admin full"
  on public.students for all using (public.is_admin());

-- ── credit_events ────────────────────────────────────────────
create policy "credit_events: public read"
  on public.credit_events for select using (true);

-- any teacher can insert, but given_by must be themselves
create policy "credit_events: teacher insert"
  on public.credit_events for insert
  with check (
    public.is_teacher()
    and given_by = auth.uid()
  );

-- teacher can delete only their own events
create policy "credit_events: teacher delete own"
  on public.credit_events for delete
  using (
    public.is_teacher()
    and given_by = auth.uid()
  );

-- admin can delete any credit event
create policy "credit_events: admin delete"
  on public.credit_events for delete
  using (public.is_admin());

-- ── gifts ─────────────────────────────────────────────────────
create policy "gifts: public read active"
  on public.gifts for select using (true);

create policy "gifts: admin full"
  on public.gifts for all using (public.is_admin());

-- ── redemption_rounds ────────────────────────────────────────
create policy "redemption_rounds: public read"
  on public.redemption_rounds for select using (true);

-- any teacher can insert a redemption
create policy "redemption_rounds: teacher insert"
  on public.redemption_rounds for insert
  with check (
    public.is_teacher()
    and marked_by = auth.uid()
  );

create policy "redemption_rounds: admin full"
  on public.redemption_rounds for all using (public.is_admin());
