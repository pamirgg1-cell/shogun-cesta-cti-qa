const fs=require("node:fs");
const vm=require("node:vm");

const html=fs.readFileSync(new URL("../index.html",`file://${__filename}`).pathname,"utf8");
const failures=[];
const check=(condition,message)=>{if(!condition)failures.push(message)};

const locationMatch=html.match(/const locations=\[([\s\S]*?)\n\];\n\n\nconst locationArtMap=/);
check(locationMatch,"Nenašiel sa kanonický zoznam lokalít.");
const locations=locationMatch?vm.runInNewContext(`[${locationMatch[1]}\n]`):[];

const pureMatch=html.match(/\/\/ \[A46_PURE_BEGIN\]([\s\S]*?)\/\/ \[A46_PURE_END\]/);
check(pureMatch,"Nenašiel sa čistý QA model a46.");
const context={locations};
vm.createContext(context);
if(pureMatch)vm.runInContext(pureMatch[1],context);
const journey=pureMatch?vm.runInContext("journeyMilestoneAudit039a46()",context):{ok:false,issues:["audit sa nespustil"]};

check(journey.ok,`Journey audit: ${(journey.issues||[]).join("; ")}`);
check(locations.length===15,`Očakávaných 15 lokalít, nájdených ${locations.length}.`);
check(new Set(locations.map(x=>x.id)).size===locations.length,"Duplicitné ID lokality.");
check(locations.every(x=>Array.isArray(x.enemies)&&x.enemies.length===4),"Každá lokalita musí mať tri bežné stretnutia a bossa.");
check(locations[0]?.level===1&&locations.at(-1)?.level===60,"Cesta nepokrýva celý rozsah Lv1–60.");
check(locations.every((x,i)=>i===0||x.level>locations[i-1].level),"Levely lokalít nie sú zoradené vzostupne.");

const artMatch=html.match(/const locationArtMap=({[\s\S]*?});\nconst firstLocationEnemyArt=/);
const locationArt=artMatch?vm.runInNewContext(`(${artMatch[1]})`):{};
check(locations.every(x=>locationArt[x.id]),"Niektorá lokalita nemá obrazový podklad.");

const shopMatch=html.match(/const SHOP_CATALOG039A18=({[\s\S]*?});\nfor\(const type of \["weapons","armor","general","jewels"\]\)/);
check(shopMatch,"Nenašiel sa kanonický katalóg obchodu.");
const shop=shopMatch?vm.runInNewContext(`(${shopMatch[1]})`):{};
const shopTypes=["weapons","armor","general","jewels"];
const milestones=[1,10,20,30,40,50,60];
for(const type of shopTypes){
 const rows=shop[type]||[];
 check(rows.length>0,`Obchod ${type} je prázdny.`);
 check(new Set(rows.map(x=>x.id)).size===rows.length,`Obchod ${type} obsahuje duplicitné ID.`);
 for(const level of milestones)check(rows.some(x=>Number(x.level||1)<=level),`Obchod ${type} nemá použiteľnú položku na Lv${level}.`);
 check(rows.some(x=>Number(x.level||1)===60),`Obchod ${type} nemá Lv60 položku.`);
}

check(/inventoryCapacity:30/.test(html),"Chýba základná kapacita inventára.");
check(/function rewardFor\(/.test(html),"Chýba výpočet odmien zo súbojov.");
check(/function fightLocation\(/.test(html),"Chýba vstup do súboja.");
check(/function regionAccess039a41\(/.test(html),"Chýba jednotné pravidlo odomykania oblastí.");
check(/function syncLevelCapUi039a46\(/.test(html)&&/MAXIMÁLNA ÚROVEŇ/.test(html),"Lv60 nemá bezpečné označenie maximálnej úrovne.");
check(!/journeyGuide039a45Script/.test(html),"Starý runtime sprievodcu a45 zostal aktívny.");

const result={
 ok:failures.length===0,
 build:"0.3.9a46",
 levels:milestones,
 regions:locations.length,
 encounters:locations.reduce((n,x)=>n+x.enemies.length,0),
 shopCategories:shopTypes.length,
 milestoneGoals:journey.milestones||[],
 levelGates:(journey.gates||[]).length,
 endgame:journey.endgame,
 failures
};
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
