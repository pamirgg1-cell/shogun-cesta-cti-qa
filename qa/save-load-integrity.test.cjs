const fs=require("node:fs");
const vm=require("node:vm");

const html=fs.readFileSync(new URL("../index.html",`file://${__filename}`).pathname,"utf8");
const failures=[];
const check=(value,message)=>{if(!value)failures.push(message)};

class MemoryStorage{
 constructor(entries={}){this.data=new Map(Object.entries(entries))}
 getItem(key){return this.data.has(key)?this.data.get(key):null}
 setItem(key,value){this.data.set(String(key),String(value))}
 removeItem(key){this.data.delete(String(key))}
}

const baseState={level:1,xp:0,gold:500,honor:0,jade:30,hp:115,maxhp:115,attrs:{Strength:5,Dexterity:5,Defense:5,Skill:5,Charisma:5},equipment:{head:null,neck:null,weapon:null,body:null,hands:null,feet:null,ring:null,token:null,extra:null},inventory:[],inventoryCapacity:30,storage:[],storageCapacity:20,loot:[],lootPage:0,defeated:{},reports:{fight:[],expedition:[]},shopSeed:1,shopRefresh:1,chronicle:[],avatarVisual:{},battleStats:{wins:0,losses:0},materials:{iron:0,steel:0,tamahagane:0,blackSteel:0,legendFragment:0,setFragment:0}};
const coreMatch=html.match(/\/\/ \[A47_SAVE_CORE_BEGIN\]([\s\S]*?)\/\/ \[A47_SAVE_CORE_END\]/);
check(coreMatch,"Chýba testovateľné jadro uloženia a47.");

function boot(entries={},search=""){
 const localStorage=new MemoryStorage(entries),context={baseState:structuredClone(baseState),state:structuredClone(baseState),localStorage,location:{search,reload(){}},URLSearchParams,clone:structuredClone,toast(){},console};
 vm.createContext(context);if(coreMatch)vm.runInContext(coreMatch[1],context);
 return {context,localStorage,run:code=>vm.runInContext(code,context)};
}

const realKey="shogunCestaCti033a65",backupKey=realKey+"__backup",qaKey=realKey+"__qa";

const fresh=boot();
check(fresh.run("state.level")===1&&fresh.run("state.gold")===500,"Nová hra sa nenačítala zo základného stavu.");

const fullSave={...structuredClone(baseState),level:30,xp:321,gold:12345,jade:77,honor:456,hp:222,maxhp:415,inventory:[{id:"I",name:"Katana",slot:"weapon",level:30,rarity:"epic",rollVersion:47}],equipment:{weapon:{id:"E",name:"Wakizashi",slot:"weapon",level:25,rarity:"rare",rollVersion:47}},storage:[{id:"S",name:"Kabuto",slot:"head",level:20,rarity:"rare",rollVersion:47}],loot:[{id:"L",name:"Obväz",level:20,rarity:"rare",heal:260}],defeated:{"monks:0":true},reports:{fight:[{win:true}],expedition:[{ok:true}]},auction039a41:{currentBid:777},training039a11:{total:9}};
const current=boot({[realKey]:JSON.stringify(fullSave)});
check(current.run("state.level")===30&&current.run("state.inventory.length")===1&&current.run("state.equipment.weapon.id") === "E","Aktuálny save nezachoval postavu, inventár alebo výbavu.");
check(current.run("state.storage.length")===1&&current.run("state.loot.length")===1&&current.run("state.reports.fight.length")===1,"Aktuálny save nezachoval sklad, korisť alebo reporty.");

const legacy=boot({shogunCestaCti023:JSON.stringify({...fullSave,level:20,gold:4321})});
check(legacy.run("state.level")===20&&legacy.run("state.gold")===4321,"Najstarší podporovaný save sa nenačítal.");
check(legacy.run("lastSaveLoadReport039a47.recovered")===true,"Migrácia legacy save nebola označená ako obnova.");

const recovery=boot({[realKey]:"{broken",[backupKey]:JSON.stringify(fullSave)});
check(recovery.run("state.level")===30&&recovery.run("lastSaveLoadReport039a47.recovered")===true,"Poškodený hlavný save sa neobnovil zo zálohy.");
check(recovery.localStorage.getItem(realKey+"__corrupt")==="{broken","Poškodený obsah nebol zachovaný na diagnostiku.");

const atomic=boot({[realKey]:JSON.stringify({...fullSave,gold:100})});
atomic.run("state.gold=999; saveGame(true)");
check(JSON.parse(atomic.localStorage.getItem(realKey)).gold===999,"Nový stav sa nezapísal do hlavného save.");
check(JSON.parse(atomic.localStorage.getItem(backupKey)).gold===100,"Predchádzajúci platný stav sa nezachoval v zálohe.");
check(atomic.localStorage.getItem(realKey+"__tmp")===null,"Dočasný save zostal po úspešnom zápise.");

const paused=boot({[realKey]:JSON.stringify({...fullSave,gold:200})});
paused.run("setSavePersistencePaused039a47(true);state.gold=333;saveGame(true)");
check(JSON.parse(paused.localStorage.getItem(realKey)).gold===200,"Pozastavený QA náhľad zmenil reálny save.");

const isolated=boot({[realKey]:JSON.stringify({...fullSave,gold:111}),[qaKey]:JSON.stringify({...fullSave,gold:222})},"?saveQa=verify");
check(isolated.run("state.gold")===222&&JSON.parse(isolated.localStorage.getItem(realKey)).gold===111,"QA namespace nie je oddelený od hráčskeho save.");

const migrationMatch=html.match(/\/\/ \[A47_MIGRATION_BEGIN\]([\s\S]*?)\/\/ \[A47_MIGRATION_END\]/);
check(migrationMatch,"Chýba testovateľná migrácia a47.");
const migrationState={...structuredClone(baseState),level:99,xp:999,gold:-5,jade:"77",inventory:"bad",storage:null,loot:{},equipment:{weapon:{id:"E",rollVersion:47}},materials:{iron:5,steel:7,tamahagane:3,blackSteel:2,legendFragment:1,setFragment:4},materials034a02:{iron:6,leather:5,essence:4,seal:8},attrs:{Strength:20,Defense:"bad"}};
const migrationContext={state:migrationState,baseState:structuredClone(baseState),normalizeItems:v=>Array.isArray(v)?v:[],ensureItemData:v=>v};
vm.createContext(migrationContext);if(migrationMatch)vm.runInContext(migrationMatch[1],migrationContext);if(migrationMatch)vm.runInContext("migratePlayerState038()",migrationContext);
const migrated=migrationContext.state;
check(migrated.dataVersion===4&&migrated.level===60&&migrated.xp===0,"Migrácia neuplatnila formát 4 alebo level cap.");
check(migrated.gold===0&&migrated.jade===77&&Array.isArray(migrated.inventory),"Migrácia neopravila číselné alebo zoznamové polia.");
check(migrated.materials===migrated.materials034a02&&migrated.materials.iron===6&&migrated.materials.steel===7&&migrated.materials.seal===8,"Migrácia nezachovala úplnú materiálovú peňaženku.");

const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
let syntaxErrors=0;
for(const block of scripts){if(/\bsrc\s*=|type\s*=\s*["'](?:application\/json|importmap)/i.test(block[1]))continue;try{new Function(block[2])}catch(_){syntaxErrors++}}
check(syntaxErrors===0,`HTML obsahuje ${syntaxErrors} syntaktických chýb.`);

const result={ok:failures.length===0,build:"0.3.9a47",format:4,tests:{fresh:true,current:true,legacy:true,recovery:true,atomicBackup:true,qaIsolation:true,materialUnion:true},syntaxErrors,failures};
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
