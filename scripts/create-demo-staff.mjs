import pg from 'pg';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID, randomBytes } from 'node:crypto';
if(process.env.VETPATH_ENV!=='demo' || !process.env.DATABASE_URL) throw Error('Set VETPATH_ENV=demo and DATABASE_URL.');
const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
try {await c.query('BEGIN');const identity=await c.query('SELECT environment FROM environment_identity WHERE singleton=true');if(identity.rows[0]?.environment!=='demo')throw Error('Database is not an isolated demo.');
 const location=await c.query("SELECT id FROM provider_locations WHERE external_id='demo-er-1' AND demo=true");if(!location.rowCount)throw Error('Run the demo seed first.');
 const email='manager@vetpath.demo';const existing=await c.query('SELECT id FROM "user" WHERE email=$1',[email]);if(existing.rowCount)throw Error('Demo manager already exists; no password was changed.');
 const password=randomBytes(18).toString('base64url');const hash=await hashPassword(password);const userId=randomUUID();const accountId=randomUUID();
 await c.query('INSERT INTO "user"(id,name,email,"emailVerified") VALUES($1,$2,$3,true)',[userId,'Demo Manager',email]);
 await c.query('INSERT INTO account(id,"userId","accountId","providerId",password) VALUES($1,$2,$2,\'credential\',$3)',[accountId,userId,hash]);
 await c.query("INSERT INTO memberships(user_id,location_id,role) VALUES($1,$2,'manager')",[userId,location.rows[0].id]);await c.query('INSERT INTO platform_admins(user_id) VALUES($1)',[userId]);await c.query('COMMIT');
 console.log('Demo manager:',email);console.log('One-time generated password:',password);console.log('Save it securely; it cannot be retrieved.');
}catch(e){await c.query('ROLLBACK');throw e;}finally{await c.end();}
