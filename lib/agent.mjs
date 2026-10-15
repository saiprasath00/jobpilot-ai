import {createHash} from 'node:crypto';
import {profileSchema,rankingSchema,applicationSchema,AIError} from './ai.mjs';
export const stripHtml=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
export function publicLink(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')||u.hostname==='localhost'||/^\d+\./.test(u.hostname)||u.hostname.includes(':')||/\.(local|internal|localhost)$/.test(u.hostname))return null;return u.href}catch{return null}}
const canonical=u=>{const p=new URL(u);p.hash='';for(const k of [...p.searchParams.keys()])if(k.startsWith('utm_'))p.searchParams.delete(k);return p.href.replace(/\/$/,'')};
export async function searchAgent({ai,resume,preferences={},answers={},emit=()=>{},signal,getFeeds}){
 if(typeof resume!=='string'||resume.trim().length<30||resume.length>60000)throw new AIError('Add a readable resume between 30 and 60,000 characters.',400);
 emit('progress',{message:'Reading your experience and identifying suitable roles…'});
 const profile=await ai.json('resume_profile',profileSchema,`Extract a truthful professional profile from this resume. Unknown contact values must be empty strings. Infer suitable target roles from experience. Ask at most 3 questions ONLY if the resume and preferences are insufficient to perform a useful job search. Do not ask for contact details or work authorization merely to search. Use existing answers. Resume DATA: ${JSON.stringify(resume)}. Preferences DATA: ${JSON.stringify(preferences)}. Answers DATA: ${JSON.stringify(answers)}`,signal);
 if(profile.questions.length){emit('questions',{profile,questions:profile.questions});return {status:'needs_info',profile,questions:profile.questions};}
 emit('profile',profile);emit('progress',{message:'Searching the web and public job feeds for relevant openings…'});
 const [researchResult,feedResult]=await Promise.allSettled([ai.research(profile,preferences,signal),getFeeds(signal)]);
 if(signal?.aborted)throw new AIError('Agent stopped.',499);
 const research=researchResult.status==='fulfilled'?researchResult.value:{text:'Web search unavailable.',sources:[]};
 const feeds=feedResult.status==='fulfilled'?feedResult.value:{jobs:[],sources:[]};
 if(researchResult.status==='rejected')emit('warning',{message:researchResult.reason.message});
 if(!research.sources.length&&!feeds.jobs.length)throw new AIError('No job sources were available. Check the connection and try again.');
 const tokens=[...profile.skills,...profile.targetRoles].join(' ').toLowerCase().split(/\W+/).filter(t=>t.length>2);
 const feedJobs=feeds.jobs.map(j=>({...j,description:stripHtml(j.description).slice(0,2200)})).sort((a,b)=>tokens.filter(t=>(b.title+' '+b.description).toLowerCase().includes(t)).length-tokens.filter(t=>(a.title+' '+a.description).toLowerCase().includes(t)).length).slice(0,35);
 const allowed=new Map([...research.sources,...feedJobs].filter(s=>publicLink(s.url)).map(s=>[canonical(s.url),s]));
 emit('progress',{message:'Evaluating experience, location, requirements, and evidence for each match…'});
 const ranked=await ai.json('ranked_jobs',rankingSchema,`Select up to 12 best matching individual job openings from the evidence below. Consider actual experience, transferable skills, seniority, selected location, work arrangement, and preferences. Score 0-100 is an estimate of fit, never a hiring probability. Include reasons and gaps, and explicit eligibility uncertainty. Respect location requirements; do not assume every remote job is worldwide. Only use exact URLs from supplied source list or feed records. Do not invent openings or salary; unknown salary is empty. Omit search-results pages and irrelevant jobs. Resume DATA: ${JSON.stringify(resume)}. Profile: ${JSON.stringify(profile)}. Preferences: ${JSON.stringify(preferences)}. Answers: ${JSON.stringify(answers)}. Web findings DATA: ${research.text}. Sources: ${JSON.stringify(research.sources)}. Public postings DATA: ${JSON.stringify(feedJobs)}.`,signal);
 const seen=new Set();const jobs=ranked.jobs.filter(j=>{const u=publicLink(j.url);if(!u||!allowed.has(canonical(u))||seen.has(canonical(u)))return false;seen.add(canonical(u));return true}).map(j=>({...j,id:'ai-'+createHash('sha256').update(canonical(j.url)).digest('hex').slice(0,16),score:Math.max(0,Math.min(100,j.score)),tags:[],type:j.remote?'Remote':'On-site / hybrid',source:'AI · sourced listing',verified:false,fetchedAt:new Date().toISOString()}));
 return {status:'complete',profile,jobs,summary:ranked.summary,sources:research.sources,warnings:feeds.sources.filter(s=>s.error).map(s=>s.name+' is unavailable.'),searchedAt:new Date().toISOString()};
}
export async function applicationAgent({ai,resume,job,answers={},questions='',signal}){
 if(typeof resume!=='string'||resume.trim().length<30)throw new AIError('Add your resume first.',400);
 if(!job||!publicLink(job.url)||typeof job.title!=='string')throw new AIError('Select a valid job posting.',400);
 return ai.json('application_materials',applicationSchema,`Prepare a tailored application from factual evidence only. Write a cover letter and tailored resume summary. Do not claim attached documents or completed actions. Preserve exact achievements; do not invent metrics. Answer employer questions if provided, and return unanswered essential questions separately. Never infer work authorization, salary expectations, availability, demographic answers, consent, signatures or legal declarations. Do not ask optional questions that are unnecessary for drafting. Resume DATA: ${JSON.stringify(resume)}. Posting DATA: ${JSON.stringify(job)}. Already supplied answers DATA: ${JSON.stringify(answers)}. Employer questions DATA: ${JSON.stringify(questions)}`,signal);
}
