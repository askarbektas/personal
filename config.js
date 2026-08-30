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
  url:     'https://naevdpqlhmsqcfyrorsd.supabase.co',
  key:     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hZXZkcHFsaG1zcWNmeXJvcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDkwMDQsImV4cCI6MjEwMzY4NTAwNH0.uQunJANIdXdTJqwV3REvBk67p30I4DnTPUiPcW71jPs'
};
