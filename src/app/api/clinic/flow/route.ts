import {headers} from 'next/headers';
import {z} from 'zod';
import {getAuth} from '../../../../server/auth';
import {sameOrigin} from '../../../../server/auth/authorize';
import {db} from '../../../../server/db/pool';
import {OperationError} from '../../../../server/services/availability';
import {moveVisit,assessCase,createSlot,confirmSlot,createHandoff,acknowledgeHandoff} from '../../../../server/services/flow';
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('visit'),caseId:z.uuid(),stage:z.string().max(40),version:z.number().int().positive()}),
 z.object({action:z.literal('assessment'),caseId:z.uuid(),priority:z.enum(['immediate','urgent','assessed_stable']),assessment:z.string().trim().min(1).max(3000),instruction:z.string().trim().max(2000).nullable()}),
 z.object({action:z.literal('slot_create'),locationId:z.uuid(),startsAt:z.iso.datetime({offset:true}),endsAt:z.iso.datetime({offset:true})}),
 z.object({action:z.literal('slot_confirm'),requestId:z.uuid()}),
 z.object({action:z.literal('handoff'),caseId:z.uuid(),receivingId:z.uuid(),instruction:z.string().trim().min(1).max(2000),consent:z.literal(true)}),
 z.object({action:z.literal('handoff_ack'),handoffId:z.uuid()})]);
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Invalid origin'},{status:403});try{const session=await getAuth().api.getSession({headers:await headers()});if(!session)return Response.json({error:'Sign in required'},{status:401});const parsed=schema.safeParse(await request.json());if(!parsed.success)return Response.json({error:'Invalid details.'},{status:400});const x=parsed.data,actor=session.user.id;switch(x.action){case 'visit':await moveVisit(db(),actor,x.caseId,x.stage,x.version);break;case 'assessment':await assessCase(db(),actor,x.caseId,x.priority,x.assessment,x.instruction);break;case 'slot_create':await createSlot(db(),actor,x.locationId,new Date(x.startsAt),new Date(x.endsAt));break;case 'slot_confirm':await confirmSlot(db(),actor,x.requestId);break;case 'handoff':await createHandoff(db(),actor,x.caseId,x.receivingId,x.instruction,x.consent);break;case 'handoff_ack':await acknowledgeHandoff(db(),actor,x.handoffId);break;}return Response.json({saved:true});}catch(e){if(e instanceof OperationError)return Response.json({error:e.code==='forbidden'?'You do not have permission.':'The item changed or the action conflicts with its current state.'},{status:e.code==='forbidden'?403:409});return Response.json({error:'Action could not be saved.'},{status:503});}}
