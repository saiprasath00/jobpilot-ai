// MWAPI's own installer configures this origin for the Anthropic Messages protocol.
// Credentials are sent only to this fixed origin; redirects are not followed.
const ENDPOINT='https://api.mwapi.dev/v1/messages';
export function createMWAPI({apiKey,model='claude-sonnet-4-6',fetcher=fetch,system,validate,AIError}){
 async function message(payload,signal){
  if(!apiKey)throw new AIError('MWAPI is not connected. Run npm run setup on the server to add your key.',503);
  const timeout=AbortSignal.timeout(120000);
  let response;try{response=await fetcher(ENDPOINT,{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${apiKey}`,'anthropic-version':'2023-06-01','Content-Type':'application/json'},body:JSON.stringify({model,system,max_tokens:7000,...payload}),signal:signal?AbortSignal.any([signal,timeout]):timeout})}catch{if(signal?.aborted)throw new AIError('Agent stopped.',499);throw new AIError('Could not reach MWAPI. Check connectivity and try again.');}
  if(!response.ok){await response.text();throw new AIError(response.status===401||response.status===403?'MWAPI rejected this key or its access permissions. Update the server configuration.':response.status===402||response.status===429?'MWAPI credit, rate, or account limit reached. Check your MWAPI dashboard.':response.status===400?'MWAPI rejected this model or feature. Check the selected model and supported tools.':`MWAPI request failed (HTTP ${response.status}).`,response.status===401?503:502);}
  const data=await response.json();if(data.type==='error'||data.error)throw new AIError('MWAPI returned an API error. Check your provider dashboard.');if(data.stop_reason==='max_tokens')throw new AIError('The model response exceeded its output limit. Try a shorter resume or request.');return data;
 }
 async function json(name,schema,prompt,signal){const data=await message({messages:[{role:'user',content:prompt}],tools:[{name:'return_'+name,description:'Return the requested factual result in this exact schema.',input_schema:schema}],tool_choice:{type:'tool',name:'return_'+name}},signal);const result=data.content?.find(x=>x.type==='tool_use'&&x.name==='return_'+name)?.input;if(!result)throw new AIError('MWAPI did not return the required structured result. Please retry.');validate(result,schema);return result;}
 async function research(profile,preferences,signal){
  const prompt=`Find up to 12 current individual job openings using web search. Today: ${new Date().toISOString().slice(0,10)}. Prefer employer career pages and reputable boards. Search relevant role variations. Include location restrictions and evidence. Do not invent URLs or claim exhaustive coverage. Professional profile DATA: ${JSON.stringify({skills:profile.skills,targetRoles:profile.targetRoles,experienceLevel:profile.experienceLevel})}. Preferences DATA: ${JSON.stringify(preferences)}. Do not search personal contact details. Cite each opening.`;
  const messages=[{role:'user',content:prompt}];let result,sources=[],texts=[];
  for(let turn=0;turn<3;turn++){
   result=await message({messages,tools:[{type:'web_search_20250305',name:'web_search',max_uses:4}],max_tokens:6000},signal);
   for(const block of result.content||[]){if(block.type==='text'){texts.push(block.text);for(const citation of block.citations||[])if(citation.url)sources.push({url:citation.url,title:citation.title||citation.url});}
    if(block.type==='web_search_tool_result'){
     if(!Array.isArray(block.content))throw new AIError('MWAPI web search is unavailable for this account. Continuing with public job feeds.');
     for(const item of block.content)if(item.type==='web_search_result'&&item.url)sources.push({url:item.url,title:item.title||item.url});
    }
   }
   if(result.stop_reason!=='pause_turn')break;
   messages.push({role:'assistant',content:result.content});
  }
  if(!sources.length)throw new AIError('MWAPI returned no web-search evidence. Continuing with public job feeds.');
  return {text:texts.join('\n'),sources:[...new Map(sources.map(s=>[s.url,s])).values()]};
 }
 return {json,research};
}
