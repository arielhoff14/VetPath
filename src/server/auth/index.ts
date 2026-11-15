import { betterAuth } from 'better-auth';
import { db } from '../db/pool';
import type { Pool } from 'pg';
export function createAuth(pool:Pool, secret:string, baseURL:string) {
 if (secret.length < 32 || !baseURL) throw new Error('Authentication is not configured');
 return betterAuth({ database: pool, secret, baseURL,
  emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:12},
  session:{expiresIn:60*60*12,updateAge:60*60},
  advanced:{useSecureCookies:process.env.NODE_ENV === 'production',ipAddress:{disableIpTracking:true}},
 });
}
let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth(): ReturnType<typeof createAuth> { return auth ??= createAuth(db(), process.env.BETTER_AUTH_SECRET ?? '', process.env.BETTER_AUTH_URL ?? ''); }
