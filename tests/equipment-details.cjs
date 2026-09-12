const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script id="a76-equipment-details">([\s\S]*?)<\/script>/)[1];
const equipped={slot:'weapon',name:'Old <blade>',dmg:2,stats:{Strength:2}};
const slot={style:{},setAttribute(){}};
const detail={},modal={classList:{remove(){}}};
const ctx={state:{equipment:{weapon:equipped}},itemBonuses:()=>'',canonicalSlot039a14:x=>x?.slot,
 escArt033a64:s=>String(s).replaceAll('<','&lt;'),
 openItemDetail(){},renderEquipment(){},document:{querySelectorAll:()=>[{}, {},slot],getElementById:id=>id==='itemDetail'?detail:modal},
 itemArtDetailHTML033a64:()=>'',itemBadges034:()=>'',setProgressHTML034:()=>'',slotNames:{weapon:'Zbraň'},window:{}};
vm.createContext(ctx);vm.runInContext(source,ctx);
assert.equal(JSON.stringify(ctx.weaponRangeA76({dmg:2})),JSON.stringify({min:18,max:22}));
const candidate={slot:'weapon',name:'New',dmg:3,stats:{Strength:1}};
const before=JSON.stringify(ctx.state);
const comparison=ctx.comparisonHTML034(candidate);
assert(comparison.includes('18–22 → 27–33'));
assert(comparison.includes('+9 / +11'));
assert(comparison.includes('(-1)'));
assert(!comparison.includes('Old <blade>'));
slot.onclick();assert(detail.innerHTML.includes('AKTUÁLNE NASADENÉ'));
assert(detail.innerHTML.includes('18–22'));assert(!detail.innerHTML.includes('onclick='));
assert.equal(JSON.stringify(ctx.state),before);
assert(ctx.comparisonHTML034(equipped).includes('AKTUÁLNE NASADENÉ'));
console.log('PASS: weapon ranges, comparison, equipped click, escaping and read-only state');
