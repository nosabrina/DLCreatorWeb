const fs=require('fs'), path=require('path'), vm=require('vm');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>{const p=path.join(dir,d.name);return d.isDirectory()?walk(p):(p.endsWith('.js')?[p]:[]);});}
const roots=['app.js','js','netlify/functions','scripts'];
let files=[];for(const r of roots){if(fs.existsSync(r)){const st=fs.statSync(r);files=files.concat(st.isDirectory()?walk(r):[r]);}}
let fail=false;for(const file of files.filter(f=>!f.includes('node_modules'))){try{new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});}catch(e){console.error('Syntaxe JS invalide:',file,e.message);fail=true;}}
process.exit(fail?1:0);
