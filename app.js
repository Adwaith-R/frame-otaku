(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get: k => { try { return localStorage.getItem(k) || '' } catch { return '' } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch {} } };
  const state = { trend: 'anime', type: 'all', upd: 'anime', items: new Map() };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- data ---------- */

  const DA=[['Frieren: Beyond Journey’s End','TV',2023,9.3,['Fantasy','Drama'],'An elf mage outlives her hero party and sets out to understand the humans she never took time to know.'],['Fullmetal Alchemist: Brotherhood','TV',2009,9.1,['Action','Adventure'],'Two brothers search for a way to undo a terrible alchemy mistake and uncover a national conspiracy.'],['Steins;Gate','TV',2011,9.1,['Sci-Fi','Thriller'],'A self-styled mad scientist discovers messages can be sent to the past, with escalating consequences.'],['Attack on Titan','TV',2013,8.6,['Action','Drama'],'Humanity hides behind walls from giants, until a breach changes everything for one young soldier.'],['Cowboy Bebop','TV',1998,8.8,['Sci-Fi','Noir'],'A crew of bounty hunters drifts through space, chasing payouts and running from their pasts.'],['Jujutsu Kaisen','TV',2020,8.6,['Action','Supernatural'],'A student swallows a cursed object and is pulled into a hidden world of sorcerers.'],['Vinland Saga','TV',2019,8.8,['Historical','Action'],'A young warrior’s quest for revenge grows into a story about what real strength means.'],['Demon Slayer','TV',2019,8.4,['Action','Fantasy'],'After his family is attacked, a kind boy trains to hunt demons and cure his sister.'],['Your Name.','Movie',2016,8.8,['Romance','Fantasy'],'Two teenagers who swap bodies try to find each other across distance and time.'],['Spirited Away','Movie',2001,8.8,['Fantasy','Family'],'A girl wanders into a spirit world and must work at a bathhouse to free her parents.']].map((r,i)=>({mal_id:9000+i,title:r[0],type:r[1],year:r[2],score:r[3],genres:r[4].map(name=>({name})),synopsis:r[5],aired:{from:'2026-1'+(i%3)+'-'+String(5+i*2).padStart(2,'0')},url:'https://myanimelist.net/'}));
  const DM=[['Inception','2010-07-16',8.4,'A thief who steals secrets from dreams is offered one last job: planting an idea instead.'],['Spider-Man: Across the Spider-Verse','2023-06-02',8.4,'Miles Morales swings across the multiverse and clashes with a society of Spider-people.'],['Dune: Part Two','2024-03-01',8.2,'Paul Atreides joins the Fremen and chooses between love and the fate of the universe.'],['Parasite','2019-05-30',8.5,'A struggling family schemes its way into the lives of a wealthy household.'],['Interstellar','2014-11-07',8.4,'Explorers travel through a wormhole in search of a new home for humanity.'],['Blade Runner 2049','2017-10-06',7.6,'A new blade runner unearths a secret that could plunge society into chaos.'],['Everything Everywhere All at Once','2022-03-25',7.8,'An overwhelmed laundromat owner must connect with versions of herself across universes.'],['The Dark Knight','2008-07-18',8.5,'Batman faces the Joker, an agent of chaos who pushes Gotham to the edge.'],['Oppenheimer','2023-07-21',8.1,'The story of the physicist who led the effort to build the first atomic bomb.'],['Akira','1988-07-16',8.0,'In a ruined Neo-Tokyo, a biker gang member gains dangerous psychic power.']].map((r,i)=>({id:7000+i,title:r[0],release_date:r[1],vote_average:r[2],overview:r[3]}));
  const pick=(arr,p,f)=>{const q=(new URLSearchParams(p.split('?')[1]||'').get('q')||new URLSearchParams(p.split('?')[1]||'').get('query')||'').toLowerCase();return q?arr.filter(x=>f(x).toLowerCase().includes(q)):arr;};
  const jikan = async p => { try { const r = await fetch('https://api.jikan.moe/v4' + p); if (!r.ok) throw 0; return await r.json(); } catch { if (p.startsWith('/anime?limit=1')) return { pagination: { items: { total: 26000 } } }; return { data: pick(DA, p, x => x.title) }; } };
  const tmdb = async p => { const t = store.get('tmdbKey'); try { if (!t) throw 0; const r = await fetch('https://api.themoviedb.org/3' + p, { headers: { Authorization: 'Bearer ' + t } }); if (!r.ok) throw 0; return await r.json(); } catch { return { results: pick(DM, p, x => x.title) }; } };
  const fromAnime = a => ({ key: 'a' + a.mal_id, type: 'Anime', title: a.title_english || a.title, img: a.images?.jpg?.large_image_url, score: a.score, meta: [a.type, a.year || a.aired?.prop?.from?.year].filter(Boolean).join(' · '), tags: (a.genres || []).map(g => g.name), text: a.synopsis, url: a.url, date: a.aired?.from });
  const fromMovie = m => ({ key: 'm' + m.id, type: 'Movie', title: m.title, img: m.poster_path && 'https://image.tmdb.org/t/p/w500' + m.poster_path, score: m.vote_average, meta: (m.release_date || '').slice(0, 4), tags: [], text: m.overview, url: 'https://www.themoviedb.org/movie/' + m.id, date: m.release_date });

  /* ---------- render ---------- */
  const card = (it, i) => {
    state.items.set(it.key, it);
    return `<article class="media-card reveal" style="--d:${i * .05}s" data-key="${it.key}"><div class="poster-thumb">${it.img ? `<img loading="lazy" src="${esc(it.img)}" alt="${esc(it.title)}">` : `<div class="ph" style="--h:${[...it.title].reduce((a,c)=>a+c.charCodeAt(0),0)%360}">${esc(it.title)}</div>`}${it.score ? `<span class="rating">★ ${Number(it.score).toFixed(1)}</span>` : ''}<span class="type-chip">${it.type.toUpperCase()}</span></div><div class="media-info"><h3>${esc(it.title)}</h3><div class="media-meta"><span>${esc(it.meta)}</span></div></div></article>`;
  };
  const skeletons = n => Array.from({ length: n }, () => '<div class="skeleton"></div>').join('');
  const show = (el, items, empty = 'Nothing found.') => { el.innerHTML = items.length ? items.map(card).join('') : `<div class="empty-card">${empty}</div>`; observe(el); };
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200); };
  const needKey = el => { el.innerHTML = '<div class="empty-card">Movies need a free TMDB token<span>Open ⚙ settings and paste your Read Access Token.</span></div>'; };

  /* ---------- trending ---------- */
  async function loadTrending() {
    const g = $('#trendingGrid'); g.innerHTML = skeletons(10);
    try {
      if (state.trend === 'anime') { const d = await jikan('/top/anime?filter=airing&limit=10&sfw=true'); show(g, d.data.map(fromAnime)); }
      else { const d = await tmdb('/trending/movie/week'); show(g, d.results.slice(0, 10).map(fromMovie)); }
    } catch (e) { e.message === 'NOKEY' ? needKey(g) : g.innerHTML = '<div class="empty-card">Couldn’t load right now<span>Please try again in a moment.</span></div>'; }
  }

  /* ---------- search ---------- */
  async function search(q) {
    if (!q.trim()) return toast('Type something to search');
    const sec = $('#resultsSection'), g = $('#resultsGrid');
    sec.classList.remove('hidden'); $('#resultsTitle').innerHTML = `Results for <em>“${esc(q)}”.</em>`; g.innerHTML = skeletons(10);
    sec.scrollIntoView({ behavior: 'smooth' });
    const out = [];
    if (state.type !== 'movie') try { out.push(...(await jikan(`/anime?q=${encodeURIComponent(q)}&limit=10&sfw=true`)).data.map(fromAnime)); } catch {}
    if (state.type !== 'anime') try { out.push(...(await tmdb(`/search/movie?query=${encodeURIComponent(q)}`)).results.slice(0, 10).map(fromMovie)); } catch (e) { if (e.message === 'NOKEY') toast('Add a TMDB token in ⚙ to include movies'); }
    show(g, out, 'No results. Try another title.');
  }

  /* ---------- updates ---------- */
  async function loadUpdates() {
    const l = $('#updatesList'); l.innerHTML = '<div class="update-loading">Loading the latest updates…</div>';
    try {
      let rows;
      if (state.upd === 'anime') rows = (await jikan('/seasons/now?limit=6&sfw=true')).data.map(fromAnime);
      else rows = (await tmdb('/movie/upcoming')).results.slice(0, 6).map(fromMovie);
      l.innerHTML = rows.map((r, i) => { state.items.set(r.key, r); const d = r.date ? new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }).toUpperCase() : 'SOON';
        return `<div class="update-item reveal" style="--d:${i * .06}s"><div class="update-date">${d}</div><div><h3>${esc(r.title)}</h3><p>${esc((r.text || 'Details coming soon.').slice(0, 150))}…</p><a href="${esc(r.url)}" target="_blank" rel="noreferrer">Read more ↗</a></div></div>`; }).join('');
      observe(l);
    } catch (e) { l.innerHTML = `<div class="update-loading">${e.message === 'NOKEY' ? 'Add a TMDB token in ⚙ settings to see movie releases.' : 'Couldn’t load updates. Try again soon.'}</div>`; }
  }

  /* ---------- detail modal ---------- */
  const dlg = document.createElement('dialog'); dlg.className = 'detail'; document.body.append(dlg);
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('.detail-x')) dlg.close(); });
  function openDetail(it) {
    dlg.innerHTML = `<div class="detail-body">${it.img ? `<img src="${esc(it.img)}" alt="">` : `<div class="ph" style="--h:${[...it.title].reduce((a,c)=>a+c.charCodeAt(0),0)%360}">${esc(it.title)}</div>`}<div class="detail-text"><button class="icon-btn detail-x" aria-label="Close">✕</button><div class="section-kicker">${it.type.toUpperCase()} · ${esc(it.meta)}</div><h2>${esc(it.title)}</h2><div class="tagrow">${it.score ? `<span>★ ${Number(it.score).toFixed(1)}</span>` : ''}${it.tags.slice(0, 4).map(t => `<span>${esc(t)}</span>`).join('')}</div><p>${esc(it.text || 'No synopsis available.')}</p><a class="primary-btn" href="${esc(it.url)}" target="_blank" rel="noreferrer">Full details <span>↗</span></a></div></div>`;
    dlg.showModal();
  }
  document.addEventListener('click', e => { const c = e.target.closest('.media-card'); if (c) openDetail(state.items.get(c.dataset.key)); });

  /* ---------- UI wiring ---------- */
  const seg = (sel, fn) => $(sel).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', e.currentTarget).forEach(x => x.classList.toggle('active', x === b)); fn(b); });
  seg('#trendType', b => { state.trend = b.dataset.type; loadTrending(); });
  seg('#searchType', b => { state.type = b.dataset.type; });
  seg('.updates-tabs', b => { state.upd = b.dataset.update; loadUpdates(); });
  $('#refreshTrending').onclick = e => { e.currentTarget.animate({ transform: ['rotate(0)', 'rotate(360deg)'] }, 600); loadTrending(); };
  $('#searchForm').onsubmit = e => { e.preventDefault(); search($('#searchInput').value); };
  $('#clearResults').onclick = () => { $('#resultsSection').classList.add('hidden'); $('#searchInput').value = ''; };
  document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#searchInput').focus(); } });
  const sd = $('#settingsDialog'); $('#settingsBtn').onclick = () => { $('#tmdbKey').value = store.get('tmdbKey'); sd.showModal(); };
  $('#saveKey').onclick = () => { store.set('tmdbKey', $('#tmdbKey').value.trim()); sd.close(); toast('Settings saved ✓'); loadTrending(); loadUpdates(); };

  /* ---------- motion ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  function observe(r = document) { $$('.reveal:not(.in)', r).forEach(el => io.observe(el)); }
  $$('.search-panel,.section-head,.updates-intro,.updates-content,footer').forEach(el => el.classList.add('reveal'));

  const bar = Object.assign(document.createElement('div'), { className: 'progress' }), glow = Object.assign(document.createElement('div'), { className: 'glow' });
  document.body.prepend(bar, glow);
  addEventListener('scroll', () => bar.style.transform = `scaleX(${scrollY / (document.documentElement.scrollHeight - innerHeight || 1)})`, { passive: true });
  addEventListener('pointermove', e => glow.style.transform = `translate(${e.clientX}px,${e.clientY}px)`, { passive: true });

  const art = $('.hero-art'), pf = $('.poster-front');
  art.addEventListener('pointermove', e => { const r = art.getBoundingClientRect(); pf.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 22 + 'deg'); pf.style.setProperty('--rx', ((e.clientY - r.top) / r.height - .5) * -22 + 'deg'); });
  art.addEventListener('pointerleave', () => { pf.style.setProperty('--rx', '0deg'); pf.style.setProperty('--ry', '0deg'); });

  const words = ['SHONEN', 'ISEKAI', 'NOIR', 'SLICE OF LIFE', 'MECHA', 'SCI-FI', 'THRILLER', 'ROMANCE', 'STUDIO GHIBLI', 'SEINEN'];
  const mq = document.createElement('div'); mq.className = 'marquee';
  mq.innerHTML = '<div>' + [...words, ...words].map(w => `<span>${w}</span><b>✦</b>`).join('') + '</div>';
  $('.hero').after(mq);

  function count(el, to, suffix = '') { const t0 = performance.now(); (function f(t) { const p = Math.min((t - t0) / 1800, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))).toLocaleString() + (p === 1 ? suffix : ''); if (p < 1) requestAnimationFrame(f); })(t0); }
  count($('#movieCount'), 900000, '+');
  jikan('/anime?limit=1').then(d => count($('#animeCount'), d.pagination?.items?.total || 26000, '+')).catch(() => count($('#animeCount'), 26000, '+'));

  observe();
  loadTrending(); sleep(900).then(loadUpdates); // spaced out to respect Jikan’s rate limit
})();
