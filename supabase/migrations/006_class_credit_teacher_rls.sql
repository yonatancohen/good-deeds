-- Teachers may edit/delete their own class-wide credit entries (mirrors credit_events).

create policy "class_credit_events: teacher update own"
  on public.class_credit_events for update
  using (
    public.is_teacher()
    and given_by = auth.uid()
  );

create policy "class_credit_events: teacher delete own"
  on public.class_credit_events for delete
  using (
    public.is_teacher()
    and given_by = auth.uid()
  );
