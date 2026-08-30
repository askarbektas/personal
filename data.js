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
      body: JSON.stringify({ email: email, password: password })
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
      body: JSON.stringify({ email: email, password: password })
    });
    const body = await r.json().catch(function(){ return {}; });
    if (!r.ok) throw new Error(body.error_description || body.msg || body.error || 'Could not create the account');
    if (body.access_token){ remember(body); return { signedIn: true }; }
    return { signedIn: false };          // the project is asking for email confirmation
  }

  function signOut(){ remember(null); }
  function signedIn(){ const s = session(); return !!(s && s.access_token); }
  function who(){ const s = session(); return s && s.user ? s.user.email : null; }

  /* a database row, in the shape the page already renders */
  function toEntry(row){
    return {
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
    if (r.status === 401 || r.status === 403) { const e = new Error('not signed in'); e.auth = true; throw e; }
    if (!r.ok) throw new Error('could not read the story (' + r.status + ')');
    return (await r.json()).map(toEntry);
  }

  /* The photo bucket is private, so an <img> cannot point straight at it.
     Each path has to be exchanged for a short-lived signed link, and they
     are asked for in one request rather than one per photograph. */
  async function signPhotos(paths){
    if (!paths.length) return {};
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
    entries: entries, add: add, upload: upload, signPhotos: signPhotos
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
    if (!DB.configured || !DB.signedIn()) return;      // the file's own STORY stands
    return DB.entries().then(function(rows){
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
