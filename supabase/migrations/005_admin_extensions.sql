-- ============================================================
-- Admin extensions: fulfilled redemptions + class-level credits
-- ============================================================

-- (א) Physical fulfillment tracking for redemption rounds
alter table public.redemption_rounds
  add column if not exists fulfilled boolean not null default false,
  add column if not exists fulfilled_at timestamptz,
  add column if not exists fulfilled_by uuid references public.users(id);

-- (ב) Class-wide credit events (not tied to individual students)
create table if not exists public.class_credit_events (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  amount int not null check (amount between 1 and 10),
  note text,
  given_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists class_credit_events_class_created_idx
  on public.class_credit_events(class_id, created_at desc);

-- RLS
alter table public.class_credit_events enable row level security;

create policy "class_credit_events: public read"
  on public.class_credit_events for select using (true);

create policy "class_credit_events: staff insert"
  on public.class_credit_events for insert
  with check (
    (public.is_teacher() or public.is_admin())
    and given_by = auth.uid()
  );

create policy "class_credit_events: admin full"
  on public.class_credit_events for all using (public.is_admin());

-- Admin can edit credit log entries
create policy "credit_events: admin update"
  on public.credit_events for update using (public.is_admin());

grant select, insert, update, delete on public.class_credit_events to authenticated;
grant select, update on public.redemption_rounds to authenticated;
