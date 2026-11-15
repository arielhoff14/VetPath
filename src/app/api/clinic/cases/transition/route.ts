import {headers} from 'next/headers';
import {z} from 'zod';
import {getAuth} from '../../../../../server/auth';
import {sameOrigin} from '../../../../../server/auth/authorize';
import {db} from '../../../../../server/db/pool';
import {transitionIntake} from '../../../../../server/services/intake';
import {OperationError} from '../../../../../server/services/availability';
const schema=z.object({caseId:z.uuid(),state:z.enum(['acknowledged','information_requested','next_step_sent','closed']),version:z.number().int().positive(),ownerText:z.string().trim().max(1000).nullable()});
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Invalid origin'},{status:403});try{const session=await getAuth().api.getSession({headers:await headers()});if(!session)return Response.json({error:'Sign in required'},{status:401});const parsed=schema.safeParse(await request.json());if(!parsed.success)return Response.json({error:'Invalid update'},{status:400});const d=parsed.data;await transitionIntake(db(),session.user.id,d.caseId,d.state,d.version,d.ownerText);return Response.json({saved:true});}catch(e){if(e instanceof OperationError)return Response.json({error:e.code==='conflict'?'The case changed or this transition is not permitted. Refresh.':'Access denied.'},{status:e.code==='conflict'?409:403});return Response.json({error:'Could not update case'},{status:503});}}
