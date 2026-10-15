import {readFile,writeFile,chmod} from 'node:fs/promises';
const provider=process.argv.find(x=>x.startsWith('--provider='))?.split('=')[1]||'mwapi';
if(!['mwapi','openai'].includes(provider))throw Error('Choose --provider=mwapi or --provider=openai.');
const stdin=process.stdin;let key='';
if(process.argv.includes('--stdin')){for await(const chunk of stdin)key+=chunk;key=key.trim()}else{
 if(!stdin.isTTY)throw Error('Run npm run setup in an interactive terminal.');
 process.stdout.write(`Paste your ${provider==='mwapi'?'MWAPI':'OpenAI'} API key (hidden), then press Enter: `);stdin.setRawMode(true);stdin.resume();
 key=await new Promise(resolve=>{const onData=chunk=>{for(const c of chunk.toString()){if(c==='\u0003'){stdin.setRawMode(false);process.exit(1)}if(c==='\r'||c==='\n'){stdin.off('data',onData);stdin.setRawMode(false);stdin.pause();process.stdout.write('\n');resolve(key);return}if(c==='\u007f')key=key.slice(0,-1);else key+=c}};stdin.on('data',onData)});
}
if(!/^sk-[A-Za-z0-9_-]{20,}$/.test(key))throw Error('That does not look like an API key. Nothing was saved.');
const file=new URL('../.env',import.meta.url);let existing='';try{existing=await readFile(file,'utf8')}catch(e){if(e.code!=='ENOENT')throw e}
const values=Object.fromEntries(existing.split('\n').filter(l=>/^[A-Z_]+=/.test(l)).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
values.AI_PROVIDER=provider;values[provider==='mwapi'?'MWAPI_API_KEY':'OPENAI_API_KEY']=key;values[provider==='mwapi'?'MWAPI_MODEL':'OPENAI_MODEL']=provider==='mwapi'?'claude-sonnet-4-6':'gpt-4.1';values.HOST||='127.0.0.1';values.PORT||='3000';
await writeFile(file,Object.entries(values).map(([k,v])=>`${k}=${v}`).join('\n')+'\n',{mode:0o600});await chmod(file,0o600);
key='';console.log('API provider configured privately on the server. Restart with npm start.');
