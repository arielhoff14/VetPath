import {createHmac} from 'node:crypto';
import type {Pool} from 'pg';
/** Requires an explicitly configured trusted proxy in pilot mode; never stores the raw address. */
export async function allowRequest(pool:Pool,request:Request,kind:string,limit:number){
 const secret=process.env.RATE_LIMIT_SECRET;if(!secret||secret.length<32)return false;
 const identity=await pool.query('SELECT environment FROM environment_identity WHERE singleton=true');
 let address:string;
 if(identity.rows[0]?.environment==='demo')address='demo-shared';
 else {const header=process.env.TRUSTED_CLIENT_IP_HEADER;if(!header)return false;address=request.headers.get(header)?.trim()??'';if(!address||address.length>128)return false;}
 const bucket=createHmac('sha256',secret).update(`${kind}:${address}`).digest('hex');
 const r=await pool.query(`INSERT INTO request_rate_limits(bucket_hash,window_start,requests) VALUES($1,date_trunc('minute',now()),1)
 ON CONFLICT(bucket_hash,window_start) DO UPDATE SET requests=request_rate_limits.requests+1 RETURNING requests`,[bucket]);return r.rows[0].requests<=limit;
}
