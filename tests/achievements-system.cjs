const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const source=html.match(/<script id="achievementA80">([\s\S]*?)<\/script>/)[1];
const host={innerHTML:''},classes=new Set();
const location={id:'monks',name:'Chrám mníchov',enemies:[['Vlk','狼',5],['Mních','僧',7],['Bandita','盗',3],['Boss','鬼',10]]};
const locations=Array.from({length:15},(_,i)=>i===0?location:{id:`region${i}`,name:`Región ${i}`,enemies:Array.from({length:4},(_,j)=>[`Nepriateľ ${i}-${j}`,'敵',10])});
const ctx=vm.createContext({state:{gold:0,honor:0,defeated:{'monks:1':true}},locations,document:{body:{classList:{remove:(...x)=>x.forEach(v=>classes.delete(v)),add:x=>classes.add(x)}},getElementById:id=>id==='achievementsA80'?host:null},toast:()=>{},saveGame:()=>true,render:()=>{},renderQuests021:()=>{},finishBattle031:()=>{},activeBattle031:null,activeWorkspace033a3:null,window:{},setTimeout:()=>{}});
vm.runInContext(source,ctx);
assert.equal(ctx.achievementDataA80().kills['monks:1'],1, 'legacy defeated enemy becomes first recorded kill');
for(let i=0;i<10;i++)ctx.recordEnemyAchievementA80(location,0);
assert.equal(ctx.achievementDataA80().kills['monks:0'],10);
assert.equal(ctx.claimEnemyAchievementA80(0,0,0),true);
assert.equal(ctx.state.gold,25);assert.equal(ctx.state.honor,1);
assert.equal(ctx.achievementDataA80().activeTitle, '', 'claiming does not force a title');
assert.equal(ctx.toggleAchievementTitleA80(0,0,0),true);
assert.match(ctx.achievementDataA80().activeTitle,/Vlk/);
assert.equal(ctx.toggleAchievementTitleA80(0,0,0),true);
assert.equal(ctx.achievementDataA80().activeTitle, '');
assert.match(host.innerHTML,/ÚSPECHY NEPRIATEĽOV/);assert.match(host.innerHTML,/1\/1/);
assert(classes.has('achievement-frame-a80-1'));

// Real victory hook increments the exact enemy that was fought.
ctx.activeBattle031={location,index:0,ei:2};ctx.finishBattle031(true);
assert.equal(ctx.achievementDataA80().kills['monks:2'],1);

// Simulate every tier for all 60 enemies. No million real battles are needed.
const tiers=[10,100,500,1000,5000,10000,100000,1000000],rewards=[[25,1],[75,1],[180,2],[400,3],[850,5],[1600,7],[7500,20],[50000,100]];
let expectedGold=ctx.state.gold,expectedHonor=ctx.state.honor;
for(let li=0;li<locations.length;li++)for(let ei=0;ei<4;ei++)for(let tier=0;tier<tiers.length;tier++){
  const key=ctx.achievementEnemyA80(locations[li],ei);ctx.achievementDataA80().kills[key]=tiers[tier];
  const [gold,honor]=rewards[tier];
  if(li!==0||ei!==0||tier!==0){assert.equal(ctx.claimEnemyAchievementA80(li,ei,tier),true);expectedGold+=gold;expectedHonor+=honor;}
}
assert.equal(ctx.state.gold,expectedGold);assert.equal(ctx.state.honor,expectedHonor);
assert.equal(Object.keys(ctx.achievementDataA80().claimed).length,480);
assert.equal(ctx.toggleAchievementTitleA80(14,3,7),true);
assert.match(ctx.achievementDataA80().activeTitle,/1000000/);
assert(classes.has('achievement-frame-a80-4'));
console.log('PASS: all 60 enemies and 480 achievement rewards grant the correct gold, honor, title and avatar frame');
