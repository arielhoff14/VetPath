import { headers } from 'next/headers';
import { getAuth } from './index';
import { db } from '../db/pool';
import { permits, type Role, type Permission } from '../domain/authorization';
export async function authorizeLocation(locationId:string, permission:Permission){
 const session = await getAuth().api.getSession({headers:await headers()});
 if (!session) return null;
 const result = await db().query('SELECT role FROM memberships WHERE user_id=$1 AND location_id=$2 AND active=true',[session.user.id,locationId]);
 const allowed=result.rows.some(r=>permits({role:r.role as Role,locationIds:[locationId],active:true},locationId,permission));
 return allowed?{userId:session.user.id}:null;
}
/** Reject unsafe mutations without an explicitly matching origin. */
export function sameOrigin(request:Request):boolean {
 const origin=request.headers.get('origin');
 if (!origin || !process.env.BETTER_AUTH_URL) return false;
 try {return new URL(origin).origin===new URL(process.env.BETTER_AUTH_URL).origin;} catch {return false;}
}
