import test from 'node:test';
import assert from 'node:assert/strict';
import {moviePath,reviewStatus,inCollection,warningFinding,shareLinks,escapeHtml} from '../public/discovery.js';
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
  assert.equal(inCollection({verdict:'edifying',themes:[{name:'Love and self-sacrifice',type:'positive',score:4}]},'lent'),true);
});
test('warning filter is evidence based and does not infer absence',()=>{
  assert.equal(warningFinding({},'violence',{}),false);
  assert.equal(warningFinding({},'violence',{content_categories:{violence:{status:'specific_findings_verified',findings:['Peril']}}}),true);
  assert.equal(warningFinding({},'violence',{content_categories:{violence:{status:'source_reports_not_present',findings:[]}}}),false);
});
test('sharing uses a canonical URL and HTML escaping',()=>{
  assert.match(shareLinks({title:'A & B',year:2020}),/https:\/\/theorthodoxlens\.org\/movies\/a-b-2020\//);
  assert.equal(escapeHtml('<script>'),'&lt;script&gt;');
});
