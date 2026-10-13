import {readFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=new URL('../',import.meta.url);
const rules={domain:['domain'],providers:['providers'],geography:['geography'],presentation:['presentation','application'],application:['application','domain','geography'],server:['server','providers']};
let count=0;
for(const [area,allowed]of Object.entries(rules)){
 for(const entry of await readdir(new URL(area+'/',root))){if(!/\.[mc]?js$/.test(entry))continue;
  const file=new URL(area+'/'+entry,root), text=await readFile(file,'utf8');
  const check=spawnSync(process.execPath,['--check',file.pathname],{encoding:'utf8'});if(check.status)throw new Error(check.stderr);
  for(const match of text.matchAll(/(?:^\s*(?:import|export)\s+(?:[^;\n]*?\sfrom\s+)?|import\s*\()\s*['"]([^'"]+)['"]/gm)){
   const spec=match[1];if(spec.startsWith('node:')){if(!['server'].includes(area))throw new Error(`${area} imports Node implementation ${spec}`);continue;}
   if(!spec.startsWith('.'))throw new Error(`Unexpected dependency ${spec}`);
   const target=path.relative(root.pathname,new URL(spec,file).pathname).split(path.sep)[0];
   if(!allowed.includes(target))throw new Error(`${area}/${entry} forbidden dependency ${spec}`);
  }
  if(area==='domain'&&/\b(?:document|localStorage|fetch|window)\s*[.(]/.test(text))throw new Error('Domain depends on UI/provider global');
  count++;
 }
}
console.log(`Syntax and declared dependency boundaries passed for ${count} product modules.`);
