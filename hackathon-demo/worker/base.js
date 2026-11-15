const PROVIDERS=__PROVIDERS__;
const PAGE=__PAGE__;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const allowed={submitted:{acknowledged:['reception','manager']},acknowledged:{arrived:['reception','manager']},arrived:{in_assessment:['clinician']},in_assessment:{completed:['clinician']}};
function sameOrigin(request){try{return request.headers.get('origin')===new URL(request.url).origin}catch{return false}}
async function body(request){const length=Number(request.headers.get('content-length')||0);if(length>2048)throw Error('Request too large');if(!request.body)return {};const reader=request.body.getReader();let text='';const decoder=new TextDecoder();try{for(;;){const part=await reader.read();if(part.done)break;text+=decoder.decode(part.value,{stream:true});if(text.length>2048){await reader.cancel();throw Error('Request too large')}}text+=decoder.decode();return JSON.parse(text||'{}')}finally{reader.releaseLock()}}
async function limited(db){const row=await db.prepare('SELECT count(*) AS n FROM demo_events WHERE created_at>?').bind(Date.now()-60000).first();return Number(row?.n||0)>=60}
export default {async fetch(request,env){const url=new URL(request.url);try{
 if(request.method==='GET'&&url.pathname==='/')return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
 if(!url.pathname.startsWith('/api/'))return new Response('Not found',{status:404});
 if(!env.DB)return json({error:'The shared demo database is unavailable.'},503);
 if(request.method==='GET'&&url.pathname==='/api/state'){
  const [s,c,e]=await Promise.all([env.DB.prepare('SELECT status,updated_at FROM demo_status WHERE id=1').first(),env.DB.prepare('SELECT id,pet,reason,stage,created_at FROM demo_cases ORDER BY created_at DESC LIMIT 50').all(),env.DB.prepare('SELECT event,count(*) AS n FROM demo_events GROUP BY event').all()]);
  return json({providers:PROVIDERS,demo:{status:s?.status||'unknown',updatedAt:s?.updated_at||null},cases:c.results||[],events:Object.fromEntries((e.results||[]).map(x=>[x.event,x.n]))});
 }
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(!sameOrigin(request))return json({error:'Invalid origin.'},403);
 if(await limited(env.DB))return json({error:'Shared demo is busy. Try again shortly.'},429);
 if(url.pathname==='/api/cases'){
  const payload=await body(request);const allowedSpecies=['Dog','Cat','Rabbit','Bird','Reptile','Other exotic'],allowedCare=['general','emergency','specialty','exotic'];if(Object.keys(payload).some(k=>!['species','care'].includes(k))||(payload.species&&!allowedSpecies.includes(payload.species))||(payload.care&&!allowedCare.includes(payload.care)))return json({error:'Only predefined fictional case categories are supported.'},400);
  const count=await env.DB.prepare('SELECT count(*) AS n FROM demo_cases').first();if(Number(count?.n||0)>=50)return json({error:'The shared demo queue is full.'},429);
  const id=crypto.randomUUID(),now=Date.now(),species=payload.species||'Dog',care=payload.care||'general',careLabel={general:'Urgent / general care',emergency:'Emergency care',specialty:'Specialty consultation',exotic:'Exotic animal care'};const item=['Sample '+species.toLowerCase()+' · fictional',careLabel[care]+' · fictional request'];
  await env.DB.batch([env.DB.prepare('INSERT INTO demo_cases(id,pet,reason,stage,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id,item[0],item[1],'submitted',now,now),env.DB.prepare('INSERT INTO demo_events(id,event,created_at) VALUES(?,?,?)').bind(crypto.randomUUID(),'case.created',now)]);return json({saved:true,id,pet:item[0]},201);
 }
 if(url.pathname==='/api/reset'){const input=await body(request);if(input.role!=='manager')return json({error:'Select the simulated manager role.'},403);await env.DB.batch([env.DB.prepare('DELETE FROM demo_cases'),env.DB.prepare('DELETE FROM demo_status'),env.DB.prepare('DELETE FROM demo_events')]);return json({saved:true});}
 if(url.pathname==='/api/status'){
  const input=await body(request);if(input.role!=='manager'||!['accepting','restricted','unknown'].includes(input.status))return json({error:'Choose the simulated manager role and a valid status.'},403);const now=Date.now();await env.DB.batch([env.DB.prepare('INSERT INTO demo_status(id,status,updated_at) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at').bind(input.status,now),env.DB.prepare('INSERT INTO demo_events(id,event,created_at) VALUES(?,?,?)').bind(crypto.randomUUID(),'availability.updated',now)]);return json({saved:true});
 }
 const match=url.pathname.match(/^\/api\/cases\/([0-9a-f-]{36})$/i);if(match){const input=await body(request);if(!allowed[input.from]?.[input.to]?.includes(input.role))return json({error:'That action requires a different simulated role or stage.'},403);const now=Date.now(),action=crypto.randomUUID();const result=await env.DB.batch([env.DB.prepare('UPDATE demo_cases SET stage=?,updated_at=?,last_action=? WHERE id=? AND stage=?').bind(input.to,now,action,match[1],input.from),env.DB.prepare('INSERT INTO demo_events(id,event,created_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM demo_cases WHERE id=? AND last_action=?)').bind(crypto.randomUUID(),'case.'+input.to,now,match[1],action)]);if(!result[0].meta?.changes)return json({error:'The sample case changed. Refresh and try again.'},409);return json({saved:true});}
 return json({error:'Not found.'},404);
 }catch{return json({error:'The shared demo service is unavailable. Please retry.'},503)} }};
