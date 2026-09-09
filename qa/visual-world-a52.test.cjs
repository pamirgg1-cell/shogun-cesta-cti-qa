const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
assert.match(html,/SHOGUN_FANTASY_WORLD_039A52/);
assert.match(html,/locations:15,uniqueEnemyPortraits:60/);
assert.match(html,/function a52Portrait/);
assert.match(html,/function renderLocationNavA52/);
assert.match(html,/A52_SETTINGS_KEY/);
assert.match(html,/a52-reduced/);
assert.match(html,/Build 0\.3\.9a52/);
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
assert.ok(scripts.length>20,'Expected inline game scripts');
for(const [i,script] of scripts.entries()){
  try{new Function(script)}catch(err){throw new Error(`Inline script ${i} does not compile: ${err.message}`)}
}
const themeBlock=html.match(/const A52_THEMES=\{([\s\S]*?)\};\nconst A52_ARCH/);
assert.ok(themeBlock,'Location visual theme map is present');
const ids=[...themeBlock[1].matchAll(/([a-z]+):\[/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,15,'Every location needs a visual theme mapping');
console.log('a52 visual world static checks passed');
