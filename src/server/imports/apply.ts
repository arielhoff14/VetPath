import type {Pool} from 'pg';
import {rowSchema,type DirectoryRow} from './csv';
export class ImportError extends Error {constructor(public code:'forbidden'|'conflict'|'invalid_source',message:string){super(message);}}
/** Directory-only batch, serialized per source. Caller must validate all rows before calling. */
export async function applyDirectorySnapshot(pool:Pool,actor:string,sourceId:string,rows:DirectoryRow[]){
 if(!rows.length || rows.length>10000 || new Set(rows.map(r=>r.externalId)).size!==rows.length)throw new ImportError('conflict','Snapshot must contain unique, valid rows.');
 const validation = rowSchema.array().safeParse(rows);if(!validation.success)throw new ImportError('conflict','Snapshot contains invalid rows.');rows=validation.data;
 const c=await pool.connect();let authorized=false;
 try{await c.query('BEGIN');const admin=await c.query('SELECT 1 FROM platform_admins WHERE user_id=$1 AND active=true FOR SHARE',[actor]);if(!admin.rowCount)throw new ImportError('forbidden','Administrator access required.');authorized=true;
  const source=await c.query('SELECT id,name,kind,is_demo FROM directory_sources WHERE id=$1 FOR UPDATE',[sourceId]);if(!source.rowCount)throw new ImportError('invalid_source','Source not found.');
  const run=await c.query("INSERT INTO sync_runs(source_id,actor_id,rows_read,status) VALUES($1,$2,$3,'running') RETURNING id",[sourceId,actor,rows.length]);let inserted=0,updated=0,unchanged=0;
  for(const row of rows){const snapshot=JSON.stringify(row);const prior=await c.query('SELECT location_id,source_snapshot=$3::jsonb AS unchanged,missing_from_source FROM source_rows WHERE source_id=$1 AND external_id=$2',[sourceId,row.externalId,snapshot]);
   if(prior.rowCount){const locationId=prior.rows[0].location_id;
    if(prior.rows[0].unchanged){unchanged++;if(prior.rows[0].missing_from_source)await c.query('UPDATE source_rows SET missing_from_source=false WHERE source_id=$1 AND external_id=$2',[sourceId,row.externalId]);continue;}
    const locks=await c.query('SELECT field_name FROM provider_field_locks WHERE location_id=$1',[locationId]);const locked=locks.rows.map(x=>x.field_name);
    const species=row.species?.split(/[|,]/).map(x=>x.trim().toLowerCase()).filter(Boolean)??[];const services=row.services?.split(/[|,]/).map(x=>x.trim().toLowerCase()).filter(Boolean)??[];
    await c.query(`UPDATE provider_locations SET
     name=CASE WHEN 'name'=ANY($2::text[]) THEN name ELSE $3 END,
     address=CASE WHEN 'address'=ANY($2::text[]) THEN address ELSE $4 END,
     latitude=CASE WHEN 'latitude'=ANY($2::text[]) THEN latitude ELSE $5 END,
     longitude=CASE WHEN 'longitude'=ANY($2::text[]) THEN longitude ELSE $6 END,
     care_type=CASE WHEN 'care_type'=ANY($2::text[]) THEN care_type ELSE $7 END,
     phone=CASE WHEN 'phone'=ANY($2::text[]) OR $8='' THEN phone ELSE $8 END,
     species=CASE WHEN 'species'=ANY($2::text[]) OR cardinality($9::text[])=0 THEN species ELSE $9 END,
     services=CASE WHEN 'services'=ANY($2::text[]) OR cardinality($10::text[])=0 THEN services ELSE $10 END,
     source_url=CASE WHEN 'source_url'=ANY($2::text[]) OR $11='' THEN source_url ELSE $11 END,updated_at=now(),version=version+1 WHERE id=$1`,[locationId,locked,row.name,row.address,row.latitude,row.longitude,row.careType,row.phone??'',species,services,row.sourceUrl??'']);
    await c.query('UPDATE source_rows SET source_snapshot=$3::jsonb,missing_from_source=false,updated_at=now() WHERE source_id=$1 AND external_id=$2',[sourceId,row.externalId,snapshot]);
    await c.query("INSERT INTO outbox_jobs(topic,payload) VALUES('provider.changed',jsonb_build_object('locationId',$1::text))",[locationId]);updated++;
   }else{
    const candidate=await c.query('SELECT id FROM provider_locations WHERE lower(trim(address))=lower(trim($1)) LIMIT 1',[row.address]);if(candidate.rowCount)throw new ImportError('conflict',`A provider with the same address needs review (source ID ${row.externalId}).`);
    const species=row.species?.split(/[|,]/).map(x=>x.trim().toLowerCase()).filter(Boolean)??[];const services=row.services?.split(/[|,]/).map(x=>x.trim().toLowerCase()).filter(Boolean)??[];
    const created=await c.query(`INSERT INTO provider_locations(external_id,name,care_type,address,phone,latitude,longitude,species,services,source_label,source_url,demo)
     VALUES($1,$2,$3,$4,NULLIF($5,''),$6,$7,$8,$9,$10,NULLIF($11,''),$12) RETURNING id`,[`source:${sourceId}:${row.externalId}`,row.name,row.careType,row.address,row.phone??'',row.latitude,row.longitude,species,services,source.rows[0].name,row.sourceUrl??'',source.rows[0].is_demo]);
    const id=created.rows[0].id;await c.query('INSERT INTO source_rows(source_id,external_id,location_id,source_snapshot) VALUES($1,$2,$3,$4::jsonb)',[sourceId,row.externalId,id,snapshot]);
    await c.query("INSERT INTO outbox_jobs(topic,payload) VALUES('provider.changed',jsonb_build_object('locationId',$1::text))",[id]);inserted++;
   }
  }
  await c.query('UPDATE source_rows SET missing_from_source=true WHERE source_id=$1 AND NOT (external_id=ANY($2::text[]))',[sourceId,rows.map(r=>r.externalId)]);
  await c.query("UPDATE sync_runs SET status='succeeded',completed_at=now(),inserted=$2,updated=$3,unchanged=$4 WHERE id=$1",[run.rows[0].id,inserted,updated,unchanged]);
  await c.query("UPDATE directory_sources SET status='ready',last_success_at=now(),revision=revision+1 WHERE id=$1",[sourceId]);
  await c.query("INSERT INTO audit_events(actor_id,action,object_type,object_id) VALUES($1,'directory.imported','directory_source',$2)",[actor,sourceId]);await c.query('COMMIT');return {inserted,updated,unchanged};
 }catch(e){await c.query('ROLLBACK');if(authorized&&!(e instanceof ImportError&&e.code==='invalid_source')){try{await c.query("INSERT INTO sync_runs(source_id,actor_id,rows_read,rejected,status,error_summary,completed_at) VALUES($1,$2,$3,$3,'failed',$4,now())",[sourceId,actor,rows.length,e instanceof ImportError?e.message:'Import failed. No changes applied.']);}catch{/* preserve original error */}}throw e;}finally{c.release();}
}
