import {readJsonLimited} from '../../../server/http/json';
import {z} from 'zod';
import {sameOrigin} from '../../../server/auth/authorize';
import {db} from '../../../server/db/pool';
import {createIntake} from '../../../server/services/intake';
import {allowRequest} from '../../../server/services/rate-limit';
const schema=z.object({locationId:z.uuid(),observations:z.string().trim().min(1).max(3000),consent:z.literal(true),sessionId:z.uuid().nullable(),searchId:z.uuid().nullable()});
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Invalid origin'},{status:403});try{if(!await allowRequest(db(),request,'intake',10))return Response.json({error:'Requests are temporarily limited. Call the clinic directly.'},{status:429});if(Number(request.headers.get('content-length'))>10000)return Response.json({error:'Request too large'},{status:413});const data=schema.safeParse(await readJsonLimited(request,10000));if(!data.success)return Response.json({error:'Complete the observations and consent fields.'},{status:400});const result=await createIntake(db(),data.data.locationId,data.data.observations,data.data.sessionId,data.data.searchId);return Response.json(result,{status:201,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});}catch{return Response.json({error:'Request could not be sent. Call the clinic directly.'},{status:503});}}
