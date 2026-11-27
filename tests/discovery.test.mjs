import test from 'node:test';
import assert from 'node:assert/strict';
import {moviePath,publicSynopsis,reviewStatus,inCollection,warningFinding,shareLinks,escapeHtml} from '../public/discovery.js';
test('movie URLs disambiguate remakes and normalize titles',()=>{
  assert.equal(moviePath({title:'Spider-Man: No Way Home',year:2021}),'/movies/spider-man-no-way-home-2021/');
  assert.notEqual(moviePath({title:'Captain America',year:1979}),moviePath({title:'Captain America',year:1990}));
});
test('review status never implies unconfirmed approval',()=>{
  assert.match(reviewStatus({verdict:'edifying'}),/pending/i);
  assert.match(reviewStatus({}),/research pending/i);
  assert.match(reviewStatus({reviewType:'published',theologicalApproval:'approved',verdict:'edifying'}),/published/i);
});
test('collections require an edifying verdict and suitable themes',()=>{
  assert.equal(inCollection({verdict:'edifying',age:'7+'},'family'),true);
  assert.equal(inCollection({verdict:'neutral',age:'7+'},'family'),false);
  assert.equal(inCollection({verdict:'edifying',themes:[{name:'Love and self-sacrifice',type:'positive',score:4}]},'lent'),false);
});
test('warning filter is evidence based and does not infer absence',()=>{
  assert.equal(warningFinding({},'violence',{}),false);
  assert.equal(warningFinding({},'violence',{content_categories:{violence:{status:'specific_findings_verified',findings:['Peril']}}}),true);
  assert.equal(warningFinding({},'violence',{content_categories:{violence:{status:'source_reports_not_present',findings:[]}}}),false);
});
test('sharing uses a canonical URL and HTML escaping',()=>{
  assert.match(shareLinks({title:'A & B',year:2020}),/https:\/\/theorthodoxlens\.org\/movies\/a-b-2020\//);
  assert.doesNotMatch(shareLinks({title:'A & B',year:2020}),/mailto:/);
  assert.match(shareLinks({title:'A & B',year:2020}),/share-control/);
  assert.equal(escapeHtml('<script>'),'&lt;script&gt;');
});


test('public synopsis expands the known short King of Kings description only',()=>{
  const movie={title:'The King of Kings',year:2025,synopsis:'Charles Dickens narrates the life of Jesus Christ to his young son in an animated retelling.'};
  assert.ok(publicSynopsis(movie).length>movie.synopsis.length);
  assert.equal(publicSynopsis({...movie,synopsis:'New editorial synopsis'}),'New editorial synopsis');
  assert.equal(publicSynopsis({...movie,year:1961}),movie.synopsis);
  assert.equal(publicSynopsis({title:'Other movie'}),'');
});
