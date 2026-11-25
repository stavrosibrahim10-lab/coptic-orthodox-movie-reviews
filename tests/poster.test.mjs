import assert from 'node:assert/strict';
import test from 'node:test';
import poster from '../netlify/functions/poster.mjs';

test('Hamilton streaming release resolves to the pinned TMDB film', async t => {
  const oldKey = process.env.TMDB_API_KEY;
  process.env.TMDB_API_KEY = 'test-key';
  t.after(() => {
    if (oldKey === undefined) delete process.env.TMDB_API_KEY;
    else process.env.TMDB_API_KEY = oldKey;
  });

  const movie = {id:556574, title:'Hamilton', release_date:'2025-09-05', poster_path:'/hamilton.jpg'};
  const fetchMovie = t.mock.method(globalThis, 'fetch', async endpoint => {
    return Response.json(endpoint.pathname === '/3/movie/556574' ? movie : {results:[movie]});
  });
  const result = await poster(new Request('https://example.org/api/poster?title=Hamilton&year=2020'));
  assert.equal(fetchMovie.mock.calls[0].arguments[0].pathname, '/3/movie/556574');
  assert.equal((await result.json()).posterUrl, 'https://image.tmdb.org/t/p/w500/hamilton.jpg');

  const other = await poster(new Request('https://example.org/api/poster?title=Hamilton&year=2019'));
  assert.equal(fetchMovie.mock.calls[1].arguments[0].pathname, '/3/search/movie');
  assert.equal((await other.json()).posterUrl, null);
});
