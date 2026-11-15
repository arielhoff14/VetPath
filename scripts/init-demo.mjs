import pg from 'pg';
if(process.env.VETPATH_ENV!=='demo' || !process.env.DATABASE_URL) throw Error('Set VETPATH_ENV=demo and DATABASE_URL for a new isolated demo database.');
const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
try{await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(90481523)');const identity=await c.query('SELECT environment FROM environment_identity');
if(identity.rowCount && identity.rows[0].environment!=='demo')throw Error('Database is not a demo environment.');
if(!identity.rowCount){const data=await c.query('SELECT (SELECT count(*) FROM provider_locations)+(SELECT count(*) FROM intake_cases)+(SELECT count(*) FROM "user") AS n');if(Number(data.rows[0].n)!==0)throw Error('Refusing to designate a nonempty database as a demo.');await c.query("INSERT INTO environment_identity(environment) VALUES('demo')");}await c.query('COMMIT');console.log('Isolated database designated as demo.');}catch(e){await c.query('ROLLBACK');throw e;}finally{await c.end();}
