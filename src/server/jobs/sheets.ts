import type {Pool} from 'pg';
import {readGoogleSheet,sheetValuesToCsv,type SheetReader} from '../integrations/sheets';
import {previewCsv,type Mapping} from '../imports/csv';
import {applyDirectorySnapshot} from '../imports/apply';
/** One external read at a time per source, including manual and scheduled runs. */
export async function syncSheet(pool:Pool,sourceId:string,reader:SheetReader=readGoogleSheet){
 const lock=await pool.connect();let locked=false;
 try{const acquired=await lock.query('SELECT pg_try_advisory_lock(hashtext($1)) AS locked',[`sheet:${sourceId}`]);locked=acquired.rows[0].locked;if(!locked)return {status:'busy' as const};
  const source=await lock.query("SELECT id,sheet_id,sheet_range,column_mapping,configured_by,poll_interval_seconds FROM directory_sources WHERE id=$1 AND kind='google_sheets'",[sourceId]);if(!source.rowCount)throw Error('Source is not configured.');const s=source.rows[0];
  if(!s.sheet_id||!s.sheet_range||!s.column_mapping||!s.configured_by)throw Error('Source is not configured.');
  const values=await reader(s.sheet_id,s.sheet_range);const preview=previewCsv(sheetValuesToCsv(values),s.column_mapping as Mapping);if(preview.errors.length||!preview.rows.length)throw Error('Sheet validation failed; review mappings and rows.');
  const counts=await applyDirectorySnapshot(pool,s.configured_by,sourceId,preview.rows);
  await lock.query("UPDATE directory_sources SET status='connected',last_error=NULL,next_poll_at=now()+(poll_interval_seconds * interval '1 second') WHERE id=$1",[sourceId]);return {status:'connected' as const,...counts};
 }catch(e){await lock.query("UPDATE directory_sources SET status='error',last_error=$2,next_poll_at=now()+(poll_interval_seconds * interval '1 second') WHERE id=$1",[sourceId,e instanceof Error&&['Source is not configured.','Sheet validation failed; review mappings and rows.','Google Sheets credentials are not configured.','Google Sheets credentials are invalid.'].includes(e.message)?e.message:'Read or import failed. Check access, source settings, and mapping.']);return {status:'error' as const};}
 finally{if(locked)await lock.query('SELECT pg_advisory_unlock(hashtext($1))',[`sheet:${sourceId}`]);lock.release();}
}
