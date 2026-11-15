import {describe,it,expect} from 'vitest';
import {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import {confirmSlot} from '../../src/server/services/flow';
const enabled=process.env.VETPATH_TEST_DB==='true' && Boolean(process.env.REAL_PG_TEST_URL);
describe.skipIf(!enabled)('real PostgreSQL concurrent slot confirmation',()=>{
 it('allows at most one confirmation under concurrent requests',async()=>{
  const pool=new Pool({connectionString:process.env.REAL_PG_TEST_URL,max:4});
  try{const name=(await pool.query('SELECT current_database() AS name')).rows[0].name;if(!name.endsWith('_test'))throw Error('Refusing to run concurrency test outside a dedicated _test database.');
   const location=randomUUID(),actor=randomUUID(),one=randomUUID(),two=randomUUID(),slot=randomUUID(),reqA=randomUUID(),reqB=randomUUID();
   await pool.query('INSERT INTO "user"(id,name,email) VALUES($1,$2,$3)',[actor,'Test',`${actor}@example.test`]);
   await pool.query("INSERT INTO provider_locations(id,name,care_type,address,latitude,longitude,source_label,demo) VALUES($1,'Test','urgent','Test',37,-122,'test',true)",[location]);
   await pool.query("INSERT INTO memberships(user_id,location_id,role) VALUES($1,$2,'manager')",[actor,location]);
   await pool.query("INSERT INTO intake_cases(id,location_id,owner_observations) VALUES($1,$3,'synthetic'),($2,$3,'synthetic')",[one,two,location]);
   await pool.query("INSERT INTO schedule_slots(id,location_id,starts_at,ends_at,created_by) VALUES($1,$2,now()+interval '1 day',now()+interval '1 day 1 hour',$3)",[slot,location,actor]);
   await pool.query('INSERT INTO slot_requests(id,slot_id,case_id) VALUES($1,$3,$4),($2,$3,$5)',[reqA,reqB,slot,one,two]);
   const outcomes=await Promise.allSettled([confirmSlot(pool,actor,reqA),confirmSlot(pool,actor,reqB)]);expect(outcomes.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect((await pool.query("SELECT count(*)::int AS n FROM slot_requests WHERE slot_id=$1 AND state='confirmed'",[slot])).rows[0].n).toBe(1);
  }finally{await pool.end();}
 },30000);
});

describe.skipIf(!enabled)('Google Sheets fixture synchronization on real PostgreSQL',()=>{
 it('preserves the last good snapshot after a later read failure',async()=>{
  const pool=new Pool({connectionString:process.env.REAL_PG_TEST_URL,max:4});
  try{const name=(await pool.query('SELECT current_database() AS name')).rows[0].name;if(!name.endsWith('_test'))throw Error('Dedicated _test database required.');
   const actor=randomUUID(),source=randomUUID();await pool.query('INSERT INTO "user"(id,name,email) VALUES($1,$2,$3)',[actor,'Admin',`${actor}@example.test`]);await pool.query('INSERT INTO platform_admins(user_id) VALUES($1)',[actor]);
   const mapping={externalId:'id',name:'name',address:'address',latitude:'lat',longitude:'lon',careType:'type'};
   await pool.query("INSERT INTO directory_sources(id,name,kind,is_demo,sheet_id,sheet_range,column_mapping,configured_by) VALUES($1,'Fixture','google_sheets',true,'abcdefghijklmnopqrstuvwxyz','Sheet1!A:F',$2::jsonb,$3)",[source,JSON.stringify(mapping),actor]);
   const {syncSheet}=await import('../../src/server/jobs/sheets');const result=await syncSheet(pool,source,async()=>[['id','name','address','lat','lon','type'],['one','Fixture Clinic',`Address ${source}`,37,-122,'urgent']]);expect(result.status).toBe('connected');
   const failed=await syncSheet(pool,source,async()=>{throw Error('simulated failure')});expect(failed.status).toBe('error');const row=await pool.query('SELECT status,last_success_at FROM directory_sources WHERE id=$1',[source]);expect(row.rows[0].status).toBe('error');expect(row.rows[0].last_success_at).toBeTruthy();expect((await pool.query('SELECT count(*)::int AS n FROM source_rows WHERE source_id=$1',[source])).rows[0].n).toBe(1);
  }finally{await pool.end();}
 },30000);
});
