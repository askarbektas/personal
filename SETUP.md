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

Open **SQL Editor** in the left sidebar. Clear whatever is in it, then open
the file `supabase-setup.sql` from this repository, copy its whole contents,
paste, and press Run.

Copy from the `.sql` file, not from this page — pasting the prose around the
SQL is what makes the editor fail with `syntax error at or near "Open"`.

If the three `storage.objects` policies at the end fail with *must be owner of
table objects*, the rest has still worked. Create those three in the dashboard
instead: **Storage → photos → Policies → New policy**, one each for SELECT,
INSERT and DELETE, target role `authenticated`.

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
