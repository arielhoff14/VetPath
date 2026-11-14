import { headers } from 'next/headers';
import { z } from 'zod';
import { getAuth } from '../../../../server/auth';
import { sameOrigin } from '../../../../server/auth/authorize';
import { db } from '../../../../server/db/pool';
import { OperationError,setAvailability } from '../../../../server/services/availability';
const schema=z.object({locationId:z.uuid(),expectedVersion:z.number().int().positive(),state:z.enum(['accepting','restricted','not_accepting','unknown']),restriction:z.string().trim().max(500).nullable(),minutes:z.number().int().min(5).max(240)}).refine(x=>x.state!=='restricted'||Boolean(x.restriction),{message:'Describe the restriction.'});
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid origin'}, {status:403});
 try{const session=await getAuth().api.getSession({headers:await headers()});if(!session)return Response.json({error:'Sign in required'},{status:401});
 let input:unknown;try{input=await request.json();}catch{return Response.json({error:'Invalid request'},{status:400});}const parsed=schema.safeParse(input);if(!parsed.success)return Response.json({error:'Invalid availability details; restricted status requires an explanation.'},{status:400});
 const result=await setAvailability(db(),session.user.id,parsed.data);return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(e instanceof OperationError)return Response.json({error:e.code==='conflict'?'This location changed. Refresh and try again.':'You do not have permission for this location.'},{status:e.code==='conflict'?409:403});return Response.json({error:'Unable to save availability.'},{status:503});}
}
