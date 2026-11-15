import { headers } from 'next/headers';
import { getAuth } from '../../../../server/auth';
import { db } from '../../../../server/db/pool';
export async function GET(){
 try{const session=await getAuth().api.getSession({headers:await headers()});if(!session)return Response.json({error:'Sign in required'}, {status:401});
 const result=await db().query(`SELECT DISTINCT p.id,p.name,p.version FROM provider_locations p JOIN memberships m ON m.location_id=p.id WHERE m.user_id=$1 AND m.active=true ORDER BY p.name`,[session.user.id]);return Response.json({locations:result.rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Workspace unavailable'}, {status:503});}
}
