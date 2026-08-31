/* ============================================================
   Where the story lives.

   These two values are meant to be public. They identify the
   project and nothing more; what actually protects the data is
   the row level security set up on the database, which lets
   only signed-in people read or write anything at all.

   Never put the service_role key here. That one ignores every
   policy.

   Set enabled to false to go back to reading story.js.
   ============================================================ */

const SUPABASE = {
  enabled: true,

  /* Supabase identifies an account by an email address, always. Nobody
     here wants to type one, so the page appends this to a bare name:
     'Askar' is sent as 'askar@samesky.app'. No mail is ever sent to it,
     and with email confirmation switched off nothing tries to deliver
     there. If Supabase ever refuses the domain, change it here and both
     of you sign in with the new one. */
  loginDomain: 'samesky.app',

  /* The story is readable by anyone who has the link, so photographs are
     fetched straight from the bucket rather than through a signed link.
     Set this back to false if the bucket is ever made private again. */
  publicPhotos: true,
  url:     'https://naevdpqlhmsqcfyrorsd.supabase.co',
  key:     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hZXZkcHFsaG1zcWNmeXJvcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDkwMDQsImV4cCI6MjEwMzY4NTAwNH0.uQunJANIdXdTJqwV3REvBk67p30I4DnTPUiPcW71jPs'
};
