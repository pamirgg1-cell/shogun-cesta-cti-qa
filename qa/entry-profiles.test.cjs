const fs=require("fs"),vm=require("vm"),path=require("path");
const html=fs.readFileSync(path.resolve(__dirname,"..","index.html"),"utf8"),fail=[];
const need=(ok,msg)=>{if(!ok)fail.push(msg)};
need(html.includes('id="entryProfiles039a51Script"'),"entry module missing");
need(html.includes('ENTRY51_SESSION_KEY'),"session namespace missing");
need(html.includes('function entry51Guest()'),"guest flow missing");
need(html.includes('function entry51LocalProfile()'),"local profile flow missing");
need(html.includes('function entry51Logout()'),"logout flow missing");
need(html.includes('realAuthentication:false'),"must disclose that this is not real authentication");
need(html.includes('passwordsStored:false'),"passwords must not be stored locally");
const entry=html.slice(html.indexOf('id="entryProfiles039a51Script"'));
need(!/type=["']password/.test(entry),"entry UI must not request a password before server auth exists");
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for(const [i,script] of scripts.entries())try{new vm.Script(script,{filename:`inline-${i}.js`})}catch(e){fail.push(`syntax inline-${i}: ${e.message}`)}
console.log(JSON.stringify({ok:!fail.length,build:"0.3.9a51",checks:{entry:!fail.some(x=>x.includes("missing")),noPasswords:!fail.some(x=>x.includes("password")),syntax:!fail.some(x=>x.startsWith("syntax"))},failures:fail},null,2));
process.exitCode=fail.length?1:0;
