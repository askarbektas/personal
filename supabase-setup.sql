-- one row per memory
create table public.entries (
  id          uuid primary key default gen_random_uuid(),
  happened_on date not null,
  title       text,
  author      text check (author in ('askar','asem')),
  place       text,
  body        jsonb not null default '[]'::jsonb,
  quote       jsonb,
  photos      jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid()
);

create index entries_happened_on_idx on public.entries (happened_on);

alter table public.entries enable row level security;

create policy "signed in can read"
  on public.entries for select
  to authenticated using (true);

create policy "signed in can add"
  on public.entries for insert
  to authenticated with check (true);

create policy "signed in can edit"
  on public.entries for update
  to authenticated using (true) with check (true);

create policy "signed in can delete"
  on public.entries for delete
  to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "signed in can read photos"
  on storage.objects for select
  to authenticated using (bucket_id = 'photos');

create policy "signed in can upload photos"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'photos');

create policy "signed in can delete photos"
  on storage.objects for delete
  to authenticated using (bucket_id = 'photos');
