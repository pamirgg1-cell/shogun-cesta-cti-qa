const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.match(html, /^<!doctype html>/i, 'DOCTYPE must precede visible content');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let count = 0;
for (const [, attributes, source] of scripts) {
  if (/type=["']text\/plain["']/.test(attributes)) continue;
  new vm.Script(source, {filename: attributes || 'inline script'});
  count++;
}
const fallback = scripts.find(([_, attributes]) => attributes.includes('id="item-art-safe-fallback033a64"'));
assert.ok(fallback, 'Fallback script exists');
const context = vm.createContext({});
new vm.Script(fallback[2]).runInContext(context);
assert.equal(context.escArt033a64('&<>"\''), '&#38;&#60;&#62;&#34;&#39;');
assert.equal(context.escArt033a64(null), '');
assert.equal(context.escArt033a64('Meč čestného rónina'), 'Meč čestného rónina');
assert.equal(context.itemArtHTML033a64({icon:'<img onerror="alert(1)">'}), '<div class="item-art-fallback033a64">&#60;img onerror=&#34;alert(1)&#34;&#62;</div>');
const spriteSource = html.match(/function item59Sprite\([\s\S]*?\n\}/);
assert.ok(spriteSource, 'Sprite renderer exists');
vm.runInContext('const ITEM59_TILES={test:["weapons",0,4]};let item59Sequence=0;', context);
vm.runInContext(spriteSource[0], context);
const svg = context.item59Sprite('test', '" onclick="bad', '<script>bad</script>');
assert.ok(!svg.includes('<script>'));
assert.ok(!svg.includes('class="" onclick='));
assert.ok(svg.includes('aria-label="&#60;script&#62;bad&#60;/script&#62;"'));
assert.ok(svg.includes('href="assets/item59/weapons.webp"'));
assert.equal(context.item59Sprite('missing'), '');
assert.notEqual(svg, context.item59Sprite('test', '" onclick="bad', '<script>bad</script>'), 'Clip IDs must be unique');
console.log(`PASS: ${count} active scripts compile; DOCTYPE, escaping, fallback and SVG regression tests`);
const equipSource = html.match(/function equip039a32\(index\)\{[\s\S]*?\n\}/);
assert.ok(equipSource, 'Active equipment handler exists');
const events = [];
const oldWeapon = {slot:'weapon', name:'Old'};
const newWeapon = {slot:'weapon', name:'New', level:1};
const equipmentContext = vm.createContext({
  state:{level:1, inventory:[newWeapon], equipment:{weapon:oldWeapon}},
  closeItemModal:()=>events.push('close'),
  hpSanity039a32:()=>events.push('health'),
  saveGame:()=>events.push('save'),
  render:()=>events.push('render'),
});
vm.runInContext(equipSource[0], equipmentContext);
assert.equal(equipmentContext.equip039a32(0), true);
assert.equal(equipmentContext.state.equipment.weapon, newWeapon);
assert.equal(equipmentContext.state.inventory[0], oldWeapon);
assert.deepEqual(events, ['close','health','save','render']);
events.length = 0;
assert.equal(equipmentContext.equip039a32(99), false);
assert.deepEqual(events, []);
equipmentContext.state.inventory = [{slot:'weapon',level:10}];
assert.equal(equipmentContext.equip039a32(0), false);
assert.equal(equipmentContext.state.equipment.weapon, newWeapon);
assert.deepEqual(events, []);
console.log('PASS: equipment swap closes stale detail; invalid and level-locked actions do not mutate equipment');
