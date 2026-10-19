-- Per-class override for points goal (null = use settings.global_goal)
alter table public.classes
  add column if not exists points_goal int
  check (points_goal is null or (points_goal between 1 and 10000));

comment on column public.classes.points_goal is
  'Optional points target for this class; when null, settings.global_goal applies';
