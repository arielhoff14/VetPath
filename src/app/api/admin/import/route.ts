import {readJsonLimited} from '../../../../server/http/json';
import { z } from 'zod';
import { currentAdmin } from '../../../../server/auth/admin';
import { sameOrigin } from '../../../../server/auth/authorize';
import { db } from '../../../../server/db/pool';
import { previewCsv,type Mapping } from '../../../../server/imports/csv';
import {workbookToCsv} from '../../../../server/imports/xlsx';
import { applyDirectorySnapshot,ImportError } from '../../../../server/imports/apply';
const columns=['externalId','name','address','latitude','longitude','careType','phone','species','services','sourceUrl','website','city','state','postalCode','hours','examFeeMinUsd','examFeeMaxUsd','examFeeScope','paymentOptions','sourceVerifiedAt'] as const;
const schema=z.object({sourceId:z.uuid(),expectedRevision:z.number().int().positive(),csv:z.string().max(10*1024*1024).optional(),xlsx:z.string().max(14*1024*1024).optional(),worksheet:z.string().max(150).optional(),mapping:z.record(z.string(),z.string().max(200).optional()),commit:z.boolean()});
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Invalid origin'},{status:403});try{const actor=await currentAdmin();if(!actor)return Response.json({error:'Administrator access required'},{status:403});if(Number(request.headers.get('content-length'))>15*1024*1024)return Response.json({error:'File too large'},{status:413});let body:unknown;try{body=await readJsonLimited(request,15728640)}catch{return Response.json({error:'Invalid request'},{status:400})}const parsed=schema.safeParse(body);if(!parsed.success)return Response.json({error:'Invalid import request'},{status:400});
 const source=await db().query('SELECT kind,revision FROM directory_sources WHERE id=$1',[parsed.data.sourceId]);if(!source.rowCount)return Response.json({error:'Source not found'},{status:404});if(source.rows[0].kind==='google_sheets')return Response.json({error:'Use Sync now to read the configured Google Sheet.'},{status:400});if(source.rows[0].revision!==parsed.data.expectedRevision)return Response.json({error:'Source changed. Refresh and validate again.'},{status:409});
 const mapping=Object.fromEntries(columns.map(key=>[key,parsed.data.mapping[key]||undefined])) as Mapping;
 let preview;let workbookInfo: {sheetNames:string[];selectedSheet:string}|undefined;try{let csv=parsed.data.csv;if(parsed.data.xlsx){if(!/^[A-Za-z0-9+/]*={0,2}$/.test(parsed.data.xlsx))throw Error('Invalid XLSX encoding.');const book=await workbookToCsv(Buffer.from(parsed.data.xlsx,'base64'),parsed.data.worksheet||undefined);csv=book.csv;workbookInfo={sheetNames:book.sheetNames,selectedSheet:book.selectedSheet};}if(!csv)throw Error('Choose a file or enter CSV data.');preview=previewCsv(csv,mapping)}catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid CSV'}, {status:400})}
 if(!parsed.data.commit)return Response.json({...workbookInfo,headers:preview.headers,rows:preview.rows.slice(0,25),rowCount:preview.rows.length,errors:preview.errors.slice(0,100),errorCount:preview.errors.length});
 if(preview.errors.length||!preview.rows.length)return Response.json({error:'Fix all validation errors before importing.'},{status:400});
 const result=await applyDirectorySnapshot(db(),actor,parsed.data.sourceId,preview.rows,parsed.data.expectedRevision);return Response.json(result);
 }catch(e){if(e instanceof ImportError)return Response.json({error:e.message},{status:e.code==='forbidden'?403:409});return Response.json({error:'Import could not be completed. No changes were applied.'},{status:503});}}
