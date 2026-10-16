import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {timingSafeEqual} from 'node:crypto';
import {createAI,AIError} from './lib/ai.mjs';
import {getFeeds} from './lib/feeds.mjs';
import {searchAgent,applicationAgent} from './lib/agent.mjs';
import {openBrowser,fillBrowser,browserAction,closeBrowser} from './lib/browser.mjs';
try{process.loadEnvFile(new URL('.env',import.meta.url).pathname)}catch(e){if(e.code!=='ENOENT')throw e}
const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||3000),password=process.env.APP_PASSWORD;
if(!['127.0.0.1','localhost','::1'].includes(host)&&!password&&process.env.CODESPACES!=='true')throw Error('Set APP_PASSWORD before allowing remote access. Use HTTPS at your reverse proxy.');
const provider=process.env.AI_PROVIDER||'mwapi';
const providerName=provider==='mwapi'?'MWAPI':'OpenAI';
const apiKey=provider==='mwapi'
 ? (process.env.MWAPI_API_KEY||process.env.JOBPILOT_MWAPI_API_KEY||process.env.API_KEY)
 : (process.env.OPENAI_API_KEY||process.env.API_KEY);
const model=provider==='mwapi'?(process.env.MWAPI_MODEL||'claude-sonnet-4-6'):(process.env.OPENAI_MODEL||'gpt-4.1');
const ai=createAI({apiKey,model,provider});
const appOrigin=process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL||(process.env.CODESPACE_NAME&&process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN?`https://${process.env.CODESPACE_NAME}-${port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`:undefined);
let busy=false;
function authorized(req){if(!password)return true;const encoded=req.headers.authorization?.split(' ')[1];let supplied='';try{supplied=Buffer.from(encoded||'','base64').toString().split(':').slice(1).join(':')}catch{}const a=Buffer.from(supplied),b=Buffer.from(password);return a.length===b.length&&timingSafeEqual(a,b)}
async function body(req){let size=0,parts=[];for await(const part of req){size+=part.length;if(size>8*1024*1024)throw new AIError('Request is too large.',413);parts.push(part)}try{return JSON.parse(Buffer.concat(parts).toString())}catch{throw new AIError('Invalid JSON request.',400)}}
const json=(res,data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
 if(req.method==='GET'&&req.url==='/healthz'){json(res,{status:'ok'});return;}
 if(!password&&!['127.0.0.1','localhost','[::1]',...(process.env.CODESPACES==='true'&&appOrigin?[new URL(appOrigin).hostname]:[])].includes((req.headers.host||'').replace(/:\d+$/,''))){json(res,{error:'Invalid host'},403);return;}
 if(!authorized(req)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Jobpilot private workspace"'});res.end('Sign in to your private workspace.');return;}
 const path=new URL(req.url,'http://localhost').pathname;
 try{
 if(req.method==='POST'){
  if(req.headers.origin&&req.headers.origin!==`${req.socket.encrypted?'https':'http'}://${req.headers.host}`&&req.headers.origin!==appOrigin)throw new AIError('Cross-origin requests are not allowed.',403);
  if(!req.headers['content-type']?.startsWith('application/json'))throw new AIError('JSON is required.',415);
  if(busy)throw new AIError('An agent task is already running. Wait or stop it first.',409);
  const input=await body(req);const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort()});const signal=controller.signal;
  busy=true;try{
   if(path==='/api/agent/search'){
    res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Accel-Buffering':'no'});res.flushHeaders();const emit=(event,data)=>{if(!res.destroyed)res.write(JSON.stringify({event,data})+'\n')};const heartbeat=setInterval(()=>emit('heartbeat',{}),15000);
    try{const result=await searchAgent({...input,ai,signal,emit,getFeeds});emit('result',result)}catch(e){emit('error',{message:e instanceof AIError?e.message:'The agent could not finish. Please retry.'})}finally{clearInterval(heartbeat);res.end()}return;
   }
   if(path==='/api/agent/application'){json(res,await applicationAgent({...input,ai,signal}));return;}
   if(path==='/api/browser/open'){json(res,await openBrowser(input.url));return;}
   if(path==='/api/browser/fill'){json(res,await fillBrowser({...input,ai,signal}));return;}
   if(path==='/api/browser/action'){json(res,await browserAction(input));return;}
   if(path==='/api/browser/close'){await closeBrowser();json(res,{closed:true});return;}
   json(res,{error:'Not found'},404);return;
  }finally{busy=false}
 }
 if(req.method!=='GET'){json(res,{error:'Method not allowed'},405);return}
 if(path==='/api/status'){json(res,{configured:!!apiKey,provider:providerName,model,browser:'local-server',busy});return}
 if(path==='/api/jobs'){json(res,await getFeeds());return}
 const files={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/location.js':['location.js','text/javascript'],'/agent-ui.js':['agent-ui.js','text/javascript'],'/style.css':['style.css','text/css'],'/manifest.webmanifest':['manifest.webmanifest','application/manifest+json'],'/icon.svg':['icon.svg','image/svg+xml']};
 const file=files[path];if(!file){json(res,{error:'Not found'},404);return}res.setHeader('Content-Type',file[1]);res.setHeader('Cache-Control','no-cache');res.end(await readFile(new URL('./public/'+file[0],import.meta.url)));
 }catch(e){if(!res.headersSent)json(res,{error:e instanceof AIError?e.message:'The request could not be completed.'},e.status||500);else res.end()}
});
server.listen(port,host,()=>console.log(`Jobpilot running at http://${host}:${port}`));
process.on('SIGTERM',async()=>{await closeBrowser();server.close()});
