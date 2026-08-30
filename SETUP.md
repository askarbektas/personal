# Setting up the private backend

The site currently reads `story.js`, a file in this repository. That works,
but it means only someone with access to the repository can add anything, and
the contents are as public as the repository is.

This moves the story and the photographs to Supabase: both of you sign in with
your own email, everything is private, and either of you can add a memory or a
photograph from a phone. The site itself stays exactly as it is — only where it
reads the story from changes.

Supabase is free at this size and stays free.

---

## 1. Create the project

1. Go to <https://supabase.com> and sign up.
2. **New project**. Name it anything. Choose the region closest to you
   (Frankfurt is usually the nearest to Tashkent).
3. Set a database password and keep it somewhere. You will not need it often.
4. Wait about two minutes for it to finish building.

## 2. Create the table and the photo bucket

Open **SQL Editor** in the left sidebar, paste all of this in, and press Run.

```sql
-- one row per memory
create table public.entries (
  id          uuid primary key default gen_random_uuid(),
  happened_on date not null,
  title       text,
  author      text check (author in ('askar','asem')),
  place       text,
  body        jsonb not null default '[]'::jsonb,   -- array of paragraphs
  quote       jsonb,                                -- { text, by }
  photos      jsonb not null default '[]'::jsonb,   -- [{ path, caption }]
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid()
);

create index entries_happened_on_idx on public.entries (happened_on);

-- nobody reaches this table without being signed in
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

-- a private bucket for the photographs
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
```

Everything is locked to `authenticated`. Nobody who is not signed in can read a
single row or open a single photograph, even with the link.

## 3. Close the door behind you

This is the step that matters. Without it anyone could sign themselves up.

1. **Authentication → Sign In / Providers → Email**: leave it enabled.
2. **Authentication → Sign In / Providers**: turn **Allow new users to sign up**
   **off**.
3. **Authentication → Users → Add user → Send invitation** — twice, once for
   your email and once for Asem's.

Now exactly two people in the world can open the site.

## 4. Send me two values

**Project Settings → API**:

- **Project URL** — looks like `https://abcdefgh.supabase.co`
- **anon public** key — a long string starting `eyJ…`

Both are safe to share and safe to sit in the repository. They are designed to
be public; the row level security above is what actually protects the data. Do
**not** send the `service_role` key — that one bypasses every policy.

---

## What happens after that

I write and test the rest against the real project:

- a sign-in screen,
- `story.js` replaced by a loader that reads from Supabase,
- the add-a-memory form writing straight to the database and uploading
  photographs from a phone camera,
- editing and deleting a memory,
- whatever is already in `story.js` moved across.

Until those two values exist, none of that can be written honestly — it would
be code I had never run.
