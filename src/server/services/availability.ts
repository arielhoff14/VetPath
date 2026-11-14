import type { Pool, PoolClient } from 'pg';
export interface AvailabilityUpdate { locationId:string; expectedVersion:number; state:'accepting'|'restricted'|'not_accepting'|'unknown'; restriction:string|null; minutes:number; }
export class OperationError extends Error { constructor(public code:'forbidden'|'conflict'|'not_found'){super(code);} }
/** Persist the assertion, audit and outbox together. The membership is checked inside the transaction. */
export async function setAvailability(pool:Pool, actor:string, update:AvailabilityUpdate) {
 const client:PoolClient=await pool.connect();
 try {await client.query('BEGIN');
  const membership=await client.query("SELECT 1 FROM memberships WHERE user_id=$1 AND location_id=$2 AND active=true AND role IN ('manager','clinician') FOR SHARE",[actor,update.locationId]);
  if(!membership.rowCount)throw new OperationError('forbidden');
  const loc=await client.query('SELECT id,version FROM provider_locations WHERE id=$1 FOR UPDATE',[update.locationId]);
  if(!loc.rowCount)throw new OperationError('not_found');
  if(loc.rows[0].version!==update.expectedVersion)throw new OperationError('conflict');
  const saved=await client.query(`INSERT INTO availability_assertions(location_id,state,restriction,observed_at,expires_at,author_id)
   VALUES($1,$2,$3,now(),now()+($4 * interval '1 minute'),$5) RETURNING id,observed_at,expires_at`,[update.locationId,update.state,update.restriction,update.minutes,actor]);
  const version=await client.query('UPDATE provider_locations SET version=version+1,updated_at=now() WHERE id=$1 RETURNING version',[update.locationId]);
  await client.query("INSERT INTO audit_events(actor_id,action,object_type,object_id) VALUES($1,'availability.updated','provider_location',$2)",[actor,update.locationId]);
  await client.query("INSERT INTO outbox_jobs(topic,payload) VALUES('provider.changed',jsonb_build_object('locationId',$1::text))",[update.locationId]);
  await client.query('COMMIT');return {version:version.rows[0].version,...saved.rows[0]};
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
