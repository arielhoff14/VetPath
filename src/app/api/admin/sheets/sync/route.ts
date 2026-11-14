import {z} from 'zod';
import {currentAdmin} from '../../../../../server/auth/admin';
import {sameOrigin} from '../../../../../server/auth/authorize';
import {db} from '../../../../../server/db/pool';
import {syncSheet} from '../../../../../server/jobs/sheets';
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Invalid origin'},{status:403});try{if(!await currentAdmin())return Response.json({error:'Administrator access required'},{status:403});const parsed=z.object({sourceId:z.uuid()}).safeParse(await request.json());if(!parsed.success)return Response.json({error:'Invalid source.'},{status:400});const result=await syncSheet(db(),parsed.data.sourceId);return Response.json(result,{status:result.status==='error'?502:200});}catch{return Response.json({error:'Sync unavailable.'},{status:503});}}
