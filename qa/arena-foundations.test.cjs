const fs=require("fs"),vm=require("vm"),path=require("path");
const root=path.resolve(__dirname,".."),html=fs.readFileSync(path.join(root,"index.html"),"utf8"),fail=[];
const need=(ok,msg)=>{if(!ok)fail.push(msg)};
need(html.includes('id="arenaFoundations039a48Script"'),"missing arena module");
need(html.includes('const ARENA48_VERSION=1'),"missing versioned arena schema");
need(html.includes('mode:"offline-shadow"'),"arena is not marked offline-shadow");
need(html.includes('serverReady:true'),"server handoff contract missing");
need(html.includes('dailyFightLimit:5'),"daily limit missing");
need(html.includes('function arenaProfile039a48()'),"serializable profile missing");
need(html.includes('function arenaResolve039a48('),"deterministic resolver missing");
need(!/fetch\s*\(|XMLHttpRequest|WebSocket/.test(html.slice(html.indexOf('id="arenaFoundations039a48Script"'))),"arena must not make network calls before hosting");
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for(const [i,script] of scripts.entries())try{new vm.Script(script,{filename:`inline-${i}.js`})}catch(e){fail.push(`syntax inline-${i}: ${e.message}`)}
console.log(JSON.stringify({ok:!fail.length,build:"0.3.9a50",checks:{module:!fail.some(x=>x.includes("module")),offline:!fail.some(x=>x.includes("network")),syntax:!fail.some(x=>x.startsWith("syntax"))},failures:fail},null,2));
process.exitCode=fail.length?1:0;
