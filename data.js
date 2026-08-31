/* ============================================================
   Reads the story.

   If Supabase is configured and somebody is signed in, the
   entries come from there. Otherwise the page falls back to
   whatever story.js holds, so a network failure, an expired
   session or a misconfigured project degrades to the site as it
   was rather than to a blank page.

   SITE (the title, the verse, the names) always comes from
   story.js. Only the entries move.
   ============================================================ */

const DB = (function(){
  const on = (typeof SUPABASE !== 'undefined') && SUPABASE.enabled;
  const base = on ? SUPABASE.url.replace(/\/+$/, '') : '';
  const KEY = 'us.session';

  function session(){
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (e){ return null; }
  }
  function remember(s){
    try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); }
    catch (e){ /* private browsing: the session simply does not outlive the tab */ }
  }

  /* a bare name becomes the address Supabase insists on; a real address
     given in full is left alone */
  function asAddress(who){
    const s = String(who).trim();
    if (s.indexOf('@') > -1) return s.toLowerCase();
    const domain = (SUPABASE.loginDomain || 'samesky.app').replace(/^@/, '');
    return s.toLowerCase().replace(/\s+/g, '') + '@' + domain;
  }

  function headers(auth){
    const h = { apikey: SUPABASE.key, 'Content-Type': 'application/json' };
    const s = session();
    h.Authorization = 'Bearer ' + (auth && s && s.access_token ? s.access_token : SUPABASE.key);
    return h;
  }

  async function signIn(email, password){
    const r = await fetch(base + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: SUPABASE.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: asAddress(email), password: password })
    });
    const body = await r.json().catch(function(){ return {}; });
    if (!r.ok) throw new Error(body.error_description || body.msg || body.error || 'Sign-in failed');
    remember(body);
    return body;
  }

  /* Creating the two accounts without going near the dashboard. This only
     works while the project allows sign-ups, which is meant to be switched
     on for the few minutes it takes and then switched off again. */
  async function signUp(email, password){
    const r = await fetch(base + '/auth/v1/signup', {
      method: 'POST',
      headers: { apikey: SUPABASE.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: asAddress(email), password: password })
    });
    const body = await r.json().catch(function(){ return {}; });
    if (!r.ok) throw new Error(body.error_description || body.msg || body.error || 'Could not create the account');
    if (body.access_token){ remember(body); return { signedIn: true }; }
    return { signedIn: false };          // the project is asking for email confirmation
  }

  function signOut(){ remember(null); }

  /* A stored session is not the same as a usable one: the access token
     lasts about an hour. Treating an expired one as signed in is what
     makes writes fail silently, so it is checked here and refreshed
     below before the page asks the database for anything. */
  function expired(s){
    return !!(s && s.expires_at && (s.expires_at * 1000) <= Date.now() + 30000);
  }
  function signedIn(){
    const s = session();
    return !!(s && s.access_token && !expired(s));
  }
  async function refresh(){
    const s = session();
    if (!s || !s.refresh_token || !expired(s)) return;
    try {
      const r = await fetch(base + '/auth/v1/token?grant_type=refresh_token', {
        method:'POST',
        headers: { apikey: SUPABASE.key, 'Content-Type':'application/json' },
        body: JSON.stringify({ refresh_token: s.refresh_token })
      });
      if (!r.ok) { remember(null); return; }      /* it is gone; ask again */
      remember(await r.json());
    } catch (e){ /* offline: leave it be and let the call fail loudly */ }
  }
  function who(){
    const s = session();
    if (!s || !s.user || !s.user.email) return null;
    const at = s.user.email.indexOf('@');
    const name = at > -1 ? s.user.email.slice(0, at) : s.user.email;
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /* A database row in the shape the page renders. The untouched row is kept
     on it: the page renders from the mapped shape but must edit from the
     original, or a save would write display values - signed photo links that
     expire within the hour - back over the stored paths. */
  function toEntry(row){
    return {
      _row:   row,
      id:     row.id,
      date:   row.happened_on,
      title:  row.title || '',
      by:     row.author || undefined,
      place:  row.place || undefined,
      text:   Array.isArray(row.body) ? row.body : [],
      quote:  row.quote || undefined,
      photos: Array.isArray(row.photos) ? row.photos : []
    };
  }

  async function entries(){
    const r = await fetch(base + '/rest/v1/entries?select=*&order=happened_on.asc', {
      headers: headers(true)
    });
    if (r.status === 401 || r.status === 403) { const e = new Error('not readable'); e.auth = true; throw e; }
    if (!r.ok) throw new Error('could not read the story (' + r.status + ')');
    return (await r.json()).map(toEntry);
  }

  /* The photo bucket is private, so an <img> cannot point straight at it.
     Each path has to be exchanged for a short-lived signed link, and they
     are asked for in one request rather than one per photograph. */
  async function signPhotos(paths){
    if (!paths.length) return {};
    if (SUPABASE.publicPhotos){
      const out = {};
      paths.forEach(function(p){
        out[p] = base + '/storage/v1/object/public/photos/' + encodeURIComponent(p);
      });
      return out;                       // a public bucket needs no signing
    }
    const r = await fetch(base + '/storage/v1/object/sign/photos', {
      method:'POST', headers: headers(true),
      body: JSON.stringify({ expiresIn: 3600, paths: paths })
    });
    if (!r.ok) return {};
    const out = {};
    (await r.json()).forEach(function(x){
      if (x.signedURL) out[x.path] = base + '/storage/v1' + x.signedURL;
    });
    return out;
  }

  async function upload(file){
    const dot = file.name.lastIndexOf('.');
    const ext = dot > -1 ? file.name.slice(dot).toLowerCase() : '.jpg';
    const path = Date.now().toString(36) + '-' +
                 Math.random().toString(36).slice(2, 10) + ext;
    const s = session();
    const r = await fetch(base + '/storage/v1/object/photos/' + path, {
      method:'POST',
      headers: { apikey: SUPABASE.key, Authorization: 'Bearer ' + s.access_token,
                 'Content-Type': file.type || 'application/octet-stream' },
      body: file
    });
    if (!r.ok) throw new Error('could not upload ' + file.name);
    return path;
  }

  async function update(id, entry){
    const r = await fetch(base + '/rest/v1/entries?id=eq.' + encodeURIComponent(id), {
      method:'PATCH',
      headers: Object.assign(headers(true), { Prefer:'return=representation' }),
      body: JSON.stringify({
        happened_on: entry.date,
        title:  entry.title || null,
        author: entry.by || null,
        place:  entry.place || null,
        body:   entry.text || [],
        quote:  entry.quote || null,
        photos: entry.photos || []
      })
    });
    if (!r.ok){
      const e = await r.json().catch(function(){ return {}; });
      throw new Error(e.message || 'could not save the change (' + r.status + ')');
    }
    const back = await r.json().catch(function(){ return []; });
    if (!back.length) throw new Error('not saved — sign in again');
    return back[0];
  }

  /* PostgREST answers a DELETE that row level security refused with 204 and
     an empty body - indistinguishable from success. Asking for the deleted
     rows back is the only way to know it actually happened. */
  async function remove(id){
    const r = await fetch(base + '/rest/v1/entries?id=eq.' + encodeURIComponent(id) + '&select=id', {
      method:'DELETE',
      headers: Object.assign(headers(true), { Prefer:'return=representation' })
    });
    if (!r.ok) throw new Error('could not remove it (' + r.status + ')');
    const gone = await r.json().catch(function(){ return []; });
    if (!gone.length) throw new Error('not removed — sign in again');
  }

  async function add(entry){
    const r = await fetch(base + '/rest/v1/entries', {
      method:'POST',
      headers: Object.assign(headers(true), { Prefer:'return=representation' }),
      body: JSON.stringify({
        happened_on: entry.date,
        title:  entry.title || null,
        author: entry.by || null,
        place:  entry.place || null,
        body:   entry.text || [],
        quote:  entry.quote || null,
        photos: entry.photos || []
      })
    });
    if (!r.ok){
      const e = await r.json().catch(function(){ return {}; });
      throw new Error(e.message || 'could not save (' + r.status + ')');
    }
    return (await r.json())[0];
  }

  return {
    configured: on,
    signIn: signIn, signUp: signUp, signOut: signOut, signedIn: signedIn, who: who,
    refresh: refresh,
    entries: entries, add: add, update: update, remove: remove, upload: upload, signPhotos: signPhotos
  };
})();

/* index.html calls this before it draws */
function loadStory(){
  return new Promise(function(resolve, reject){
    const el = document.createElement('script');
    el.src = 'story.js?t=' + Date.now();
    el.onload = resolve;
    el.onerror = function(){ reject(new Error('story.js did not load')); };
    document.head.appendChild(el);
  }).then(function(){
    if (!DB.configured) return;                       // the file's own STORY stands
    /* keep the file's own entries: the page compares them with what the
       database holds so it can offer to move across whatever is missing,
       not only on the first sign-in */
    window.__fileStory = (typeof STORY !== 'undefined') ? STORY.slice() : [];
    return DB.refresh().then(DB.entries).then(function(rows){
      window.__dbRows = rows;
      if (!rows.length) return;                        // the file's own STORY stands
      const paths = [];
      rows.forEach(function(r){
        (r.photos || []).forEach(function(p){ if (p.path) paths.push(p.path); });
      });
      return DB.signPhotos(paths).then(function(links){
        rows.forEach(function(r){
          r.photos = (r.photos || []).map(function(p){
            return { src: p.path ? (links[p.path] || '') : p.src, caption: p.caption || '' };
          }).filter(function(p){ return p.src; });
        });
        window.STORY = rows;                           // the database wins once it has anything
      });
    }).catch(function(err){
      console.warn('falling back to story.js:', err.message);
    });
  });
}
