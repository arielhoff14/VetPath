import { headers } from 'next/headers';
import { getAuth } from './index';
import { db } from '../db/pool';
export async function currentAdmin(){const session=await getAuth().api.getSession({headers:await headers()});if(!session)return null;const result=await db().query('SELECT 1 FROM platform_admins WHERE user_id=$1 AND active=true',[session.user.id]);return result.rowCount?session.user.id:null;}
