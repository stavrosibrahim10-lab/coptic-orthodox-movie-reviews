import assert from 'node:assert/strict';
import test from 'node:test';
import studio from '../netlify/functions/studio.mjs';
import {catalogFilmKey, marvelCatalog} from '../public/marvel-catalog.js';

test('Marvel films have distinct release identities and preserve existing IDs', () => {
  assert.equal(new Set(marvelCatalog.map(film => film.id)).size, marvelCatalog.length);
  assert.equal(new Set(marvelCatalog.map(catalogFilmKey)).size, marvelCatalog.length);
  assert.equal(marvelCatalog.find(film => film.title === 'Big Hero 6').id, 'catalog-2014-bighero6');
  assert.deepEqual(marvelCatalog.filter(film => film.title === 'Fantastic Four').map(film => film.year), [2005, 2015]);
  assert.ok(marvelCatalog.every(film => film.sources.every(source => new URL(source.url).protocol === 'https:')));
});

test('Studio registers missing Marvel films as unscored drafts exactly once', async t => {
  const env = {SUPABASE_URL:'https://example.supabase.co', SUPABASE_SECRET_KEY:'mock-secret', SUPABASE_PUBLISHABLE_KEY:'mock-public'};
  const saved = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  Object.assign(process.env, env);
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const existingFilm = {movie_id:'legacy-iron-man', title:'Iron Man', release_year:2008, verdict:'neutral', workflow:'draft', revision:7};
  const existing = [existingFilm, {movie_id:'catalog-2020-hamilton'}, {movie_id:'catalog-2017-the-emoji-movie'}]
    .map(row => ({title:'Other film',release_year:2000,...row}));
  let writes = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const path = new URL(url).pathname;
    if (path === '/auth/v1/user') return Response.json({id:'author',email:'author@example.com'});
    if (path === '/rest/v1/studio_members') return Response.json([{active:true,role:'owner'}]);
    if (path !== '/rest/v1/studio_reviews') return Response.json([]);
    if (options.method === 'POST') {
      writes++;
      assert.match(options.headers.Prefer,/resolution=ignore-duplicates/);
      existing.push(...JSON.parse(options.body));
    }
    return Response.json(existing);
  });
  const bootstrap = () => studio(new Request('https://example.org/api/studio',{
    method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},
    body:JSON.stringify({action:'bootstrap'}),
  }));
  const first = await bootstrap();
  assert.equal(first.status,200);
  assert.equal((await first.json()).releaseDraftsPending,false);
  const spiderMan = existing.find(row => row.movie_id === 'marvel-2002-spider-man');
  assert.equal(spiderMan.verdict,null);
  assert.equal(spiderMan.suggested_age,null);
  assert.equal(spiderMan.workflow,'draft');
  assert.equal(spiderMan.draft.themes[0].score,null);
  assert.equal(existing.find(row => row.title === 'Iron Man').revision,7);
  assert.equal(existing.filter(row => row.title === 'Iron Man').length,1);
  assert.equal((await bootstrap()).status,200);
  assert.equal(writes,1);
});
