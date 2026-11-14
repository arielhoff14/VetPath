import pg from 'pg';
if(process.env.VETPATH_ENV !== 'demo') throw new Error('Demo seed requires VETPATH_ENV=demo. Never run this against a real-data database.');
if(!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL first.');
const clinics = [
 ['demo-er-1','Demo Willow Emergency','emergency','101 Fictional Way, San Jose, CA',37.3382,-121.8863,['dog','cat'],['emergency']],
 ['demo-er-2','Demo Oak Emergency','emergency','202 Fictional Way, Santa Clara, CA',37.3541,-121.9552,['dog','cat'],['emergency']],
 ['demo-urgent-1','Demo Meadow Urgent Care','urgent','303 Fictional Way, San Jose, CA',37.32,-121.91,['dog','cat'],['urgent']],
 ['demo-urgent-2','Demo Creek Urgent Care','urgent','404 Fictional Way, Campbell, CA',37.287,-121.95,['dog','cat','rabbit'],['urgent']],
 ['demo-specialty-1','Demo Cedar Specialty','specialty','505 Fictional Way, San Jose, CA',37.31,-121.86,['dog','cat'],['specialty']],
 ['demo-general-1','Demo Hill Veterinary','general','606 Fictional Way, Milpitas, CA',37.43,-121.91,['dog','cat'],['general']],
 ['demo-general-2','Demo Grove Veterinary','general','707 Fictional Way, Sunnyvale, CA',37.37,-122.03,['dog','cat','bird'],['general']],
 ['demo-general-3','Demo Park Veterinary','general','808 Fictional Way, Cupertino, CA',37.32,-122.03,['dog','cat'],['general']]
];
const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
try{await c.query('BEGIN');for(const [externalId,name,type,address,lat,lon,species,services] of clinics){await c.query(`INSERT INTO provider_locations(external_id,name,care_type,address,latitude,longitude,species,services,source_label,demo) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'Fictional demo data',true) ON CONFLICT(external_id) DO NOTHING`,[externalId,name,type,address,lat,lon,species,services]);}await c.query('COMMIT');console.log('Demo providers inserted where absent. Existing data was not reset.');}catch(e){await c.query('ROLLBACK');throw e;}finally{await c.end();}
