import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { Pool } from 'pg';
import { readFile,mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setAvailability } from '../../src/server/services/availability';
let embedded:PGlite; let server:PGLiteSocketServer; let pool:Pool; let dir:string;
const a='10000000-0000-4000-8000-000000000001', b='10000000-0000-4000-8000-000000000002';
beforeAll(async()=>{
 embedded=await PGlite.create();
 for(const file of ['0001_foundation.sql','0002_auth.sql','0003_operations.sql','0004_sources.sql','0005_intake.sql','0006_sheets.sql','0007_flow.sql','0008_reporting.sql','0009_activation.sql','0010_profile.sql','0011_source_identity.sql']) await embedded.exec(await readFile(`src/db/migrations/${file}`,'utf8'));
 dir=await mkdtemp(join(tmpdir(),'vetpath-test-'));server=new PGLiteSocketServer({db:embedded,path:join(dir,'.s.PGSQL.5432')});await server.start();pool=new Pool({host:dir,port:5432,user:'postgres',database:'postgres',max:1});
 await pool.query(`INSERT INTO "user"(id,name,email) VALUES('manager-a','A','a@example.test'),('reception-a','R','r@example.test')`);
 await pool.query("INSERT INTO provider_locations(id,name,care_type,address,latitude,longitude,source_label) VALUES($1,'Demo A','emergency','A',37,-122,'demo'),($2,'Demo B','urgent','B',37,-122,'demo')",[a,b]);
 await pool.query("INSERT INTO memberships(user_id,location_id,role) VALUES('manager-a',$1,'manager'),('reception-a',$1,'reception')",[a]);
},30000);
afterAll(async()=>{await pool?.end();await server?.stop();await embedded?.close();if(dir)await rm(dir,{recursive:true,force:true});},30000);
describe('availability transaction against PostgreSQL-compatible database',()=>{
 it('denies cross-location and receptionist writes without changing data',async()=>{
  const update={locationId:b,expectedVersion:1,state:'accepting' as const,restriction:null,minutes:60};
  await expect(setAvailability(pool,'manager-a',update)).rejects.toMatchObject({code:'forbidden'});
  await expect(setAvailability(pool,'reception-a',{...update,locationId:a})).rejects.toMatchObject({code:'forbidden'});
  expect((await pool.query('SELECT count(*)::int AS n FROM availability_assertions')).rows[0].n).toBe(0);
 });
 it('writes assertion, audit and outbox atomically and rejects stale versions',async()=>{
  const update={locationId:a,expectedVersion:1,state:'restricted' as const,restriction:'Call first',minutes:60};
  const saved=await setAvailability(pool,'manager-a',update);expect(saved.version).toBe(2);
  await expect(setAvailability(pool,'manager-a',update)).rejects.toMatchObject({code:'conflict'});
  const rows=await pool.query('SELECT (SELECT count(*) FROM availability_assertions)::int AS assertions,(SELECT count(*) FROM audit_events)::int AS audits,(SELECT count(*) FROM outbox_jobs)::int AS jobs');
  expect(rows.rows[0]).toEqual({assertions:1,audits:1,jobs:1});
 });
});

describe('staff authentication',()=>{
 it('rejects public signup and authenticates a provisioned account',async()=>{
  const {createAuth}=await import('../../src/server/auth');const {hashPassword}=await import('better-auth/crypto');
  const auth=createAuth(pool,'this-is-a-long-test-secret-with-over-32-characters','http://localhost:3000');
  const hash=await hashPassword('test-password-that-is-long');
  await pool.query(`INSERT INTO account(id,"userId","accountId","providerId",password) VALUES('account-a','manager-a','manager-a','credential',$1)`,[hash]);
  const signup=await auth.handler(new Request('http://localhost:3000/api/auth/sign-up/email',{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost:3000'},body:JSON.stringify({name:'Imposter',email:'evil@example.test',password:'this-is-a-long-password'})}));
  expect(signup.status).not.toBe(200);
  const signin=await auth.handler(new Request('http://localhost:3000/api/auth/sign-in/email',{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost:3000'},body:JSON.stringify({email:'a@example.test',password:'test-password-that-is-long'})}));
  expect(signin.status).toBe(200);expect(signin.headers.get('set-cookie')).toContain('session_token');
 },30000);
});


describe('directory synchronization',()=>{
 it('reimports by stable ID and preserves locked fields',async()=>{
  const {applyDirectorySnapshot}=await import('../../src/server/imports/apply');
  const source='20000000-0000-4000-8000-000000000001';await pool.query("INSERT INTO platform_admins(user_id) VALUES('manager-a')");await pool.query("INSERT INTO directory_sources(id,name,kind,is_demo) VALUES($1,'Demo source','csv',true)",[source]);
  const rows=[{externalId:'clinic-1',name:'Clinic One',address:'123 Fictional Road',latitude:37,longitude:-122,careType:'urgent' as const,phone:'5550000'}];
  expect(await applyDirectorySnapshot(pool,'manager-a',source,rows)).toEqual({inserted:1,updated:0,unchanged:0});
  expect(await applyDirectorySnapshot(pool,'manager-a',source,rows)).toEqual({inserted:0,updated:0,unchanged:1});
  const location=(await pool.query('SELECT location_id FROM source_rows WHERE source_id=$1',[source])).rows[0].location_id;
  await pool.query("INSERT INTO provider_field_locks(location_id,field_name,reason,locked_by) VALUES($1,'phone','verified','manager-a')",[location]);
  expect(await applyDirectorySnapshot(pool,'manager-a',source,[{...rows[0],name:'Renamed',phone:'9999999'}])).toEqual({inserted:0,updated:1,unchanged:0});
  const current=(await pool.query('SELECT name,phone FROM provider_locations WHERE id=$1',[location])).rows[0];expect(current).toEqual({name:'Renamed',phone:'5550000'});
  await expect(applyDirectorySnapshot(pool,'reception-a',source,rows)).rejects.toMatchObject({code:'forbidden'});
 });
});

describe('case-specific intake access',()=>{
 it('creates an owner grant and prevents unauthorized case transitions',async()=>{
  const {createIntake,readOwnerCase,transitionIntake}=await import('../../src/server/services/intake');
  await pool.query('UPDATE provider_locations SET receives_requests=true WHERE id=$1',[a]);
  const created=await createIntake(pool,a,'Synthetic concern only');expect(created.token).toHaveLength(43);
  expect((await readOwnerCase(pool,created.token))?.state).toBe('submitted');expect(await readOwnerCase(pool,'unrelated-token')).toBeNull();
  await expect(transitionIntake(pool,'missing-user',created.caseId,'acknowledged',1,null)).rejects.toMatchObject({code:'forbidden'});
  await expect(transitionIntake(pool,'manager-a',created.caseId,'next_step_sent',1,null)).rejects.toMatchObject({code:'conflict'});
  await transitionIntake(pool,'manager-a',created.caseId,'acknowledged',1,'A staff member acknowledged your request.');
  const visible=await readOwnerCase(pool,created.token);expect(visible?.state).toBe('acknowledged');expect(visible?.updates).toHaveLength(2);
  expect(JSON.stringify(visible)).not.toContain('Synthetic concern only');
 });
});

describe('clinical flow and appointment safeguards',()=>{
 it('only allows clinicians to assess and prevents two confirmations for one slot',async()=>{
  const {createIntake}=await import('../../src/server/services/intake');const {assessCase,confirmSlot,requestSlot}=await import('../../src/server/services/flow');
  await pool.query(`INSERT INTO "user"(id,name,email) VALUES('clinician-a','Clinician','clinician@example.test')`);await pool.query("INSERT INTO memberships(user_id,location_id,role) VALUES('clinician-a',$1,'clinician')",[a]);
  const one=await createIntake(pool,a,'Synthetic first');const two=await createIntake(pool,a,'Synthetic second');
  await expect(assessCase(pool,'reception-a',one.caseId,'urgent','Assessment',null)).rejects.toMatchObject({code:'forbidden'});
  await assessCase(pool,'clinician-a',one.caseId,'urgent','Simulated professional assessment',null);
  const slot=(await pool.query("INSERT INTO schedule_slots(location_id,starts_at,ends_at,created_by) VALUES($1,now()+interval '1 day',now()+interval '1 day 1 hour','manager-a') RETURNING id",[a])).rows[0].id;
  await requestSlot(pool,one.token,slot);await requestSlot(pool,two.token,slot);const req=(await pool.query('SELECT id FROM slot_requests WHERE slot_id=$1 ORDER BY created_at',[slot])).rows;
  await confirmSlot(pool,'manager-a',req[0].id);await expect(confirmSlot(pool,'manager-a',req[1].id)).rejects.toMatchObject({code:'conflict'});
  expect((await pool.query("SELECT count(*)::int AS n FROM slot_requests WHERE slot_id=$1 AND state='confirmed'",[slot])).rows[0].n).toBe(1);
 });
});

describe('case-scoped handoff',()=>{
 it('requires clinician authorization and an acknowledged, unexpired grant',async()=>{
  const {createIntake}=await import('../../src/server/services/intake');const {createHandoff,acknowledgeHandoff,createSlot}=await import('../../src/server/services/flow');
  await pool.query(`INSERT INTO "user"(id,name,email) VALUES('clinician-b','Receiver','receiver@example.test')`);await pool.query("INSERT INTO memberships(user_id,location_id,role) VALUES('clinician-b',$1,'clinician')",[b]);await pool.query('UPDATE provider_locations SET receives_requests=true WHERE id=$1',[b]);
  const created=await createIntake(pool,a,'Synthetic share');
  await expect(createHandoff(pool,'reception-a',created.caseId,b,'Call first',true)).rejects.toMatchObject({code:'forbidden'});
  await expect(createHandoff(pool,'clinician-a',created.caseId,b,'Call first',false)).rejects.toMatchObject({code:'conflict'});
  await createHandoff(pool,'clinician-a',created.caseId,b,'Call first',true);const handoff=(await pool.query('SELECT id,state FROM handoffs WHERE case_id=$1',[created.caseId])).rows[0];expect(handoff.state).toBe('pending');
  await expect(acknowledgeHandoff(pool,'reception-a',handoff.id)).rejects.toMatchObject({code:'forbidden'});
  await acknowledgeHandoff(pool,'clinician-b',handoff.id);expect((await pool.query('SELECT state FROM handoffs WHERE id=$1',[handoff.id])).rows[0].state).toBe('acknowledged');
  const start=new Date(Date.now()+3*86400000),end=new Date(start.getTime()+3600000);await createSlot(pool,'manager-a',a,start,end);await expect(createSlot(pool,'manager-a',a,new Date(start.getTime()+1000),end)).rejects.toMatchObject({code:'conflict'});
 });
});

describe('directory matching',()=>{
 it('returns explicit alternatives for strict unknown filters and does not suppress emergency care on price',async()=>{
  const {searchProviders}=await import('../../src/server/repositories/providers');
  const strict=await searchProviders({lat:37,lon:-122,species:'rabbit',includeUnknown:false},pool);expect(strict.alternatives).toBe(true);expect(strict.providers.length).toBeGreaterThan(0);expect(strict.providers[0].unknowns).toContain('Species support unconfirmed');
  const fee=await searchProviders({lat:37,lon:-122,includeUnknown:false,maxFeeCents:1},pool);expect(fee.providers.some(p=>p.id===a)).toBe(true);expect(fee.providers.some(p=>p.id===b)).toBe(false);
 });
});
