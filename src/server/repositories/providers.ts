import { db } from '../db/pool';
import type {Pool} from 'pg';
import { currentAvailability, distanceMiles, type Fact, type IntakeState } from '../domain/discovery';
export interface Search { lat:number;lon:number;species?:string;careType?:string;includeUnknown:boolean;radius?:number;intake?:'accepting';service?:string;maxFeeCents?:number;payment?:string; }
/** Select only public, allowlisted fields. No case, staff, or credential records leave this query. */
export async function searchProviders(search:Search,pool:Pool=db()){
 const result=await pool.query(`SELECT p.id,p.name,p.care_type,p.address,p.phone,p.latitude,p.longitude,p.species,p.services,p.source_label,p.source_url,p.demo,p.fictional,p.receives_requests,p.city,p.state,p.postal_code,p.website,p.hours_text,p.exam_fee_min_cents,p.exam_fee_max_cents,p.exam_fee_scope,p.payment_options,p.source_verified_at,
 a.state AS intake_state,a.restriction,a.observed_at,a.expires_at FROM provider_locations p LEFT JOIN LATERAL (SELECT state,restriction,observed_at,expires_at FROM availability_assertions WHERE location_id=p.id ORDER BY observed_at DESC,id DESC LIMIT 1) a ON true`);
 const now=new Date();const providers=result.rows.map(row=>{const speciesFit:Fact=!search.species?'unknown':row.species.includes(search.species)?'yes':'unknown';const serviceFit:Fact=!search.service?'unknown':row.services.includes(search.service)?'yes':'unknown';
 const availability=currentAvailability(row.intake_state?{state:row.intake_state as IntakeState,restriction:row.restriction,expiresAt:row.expires_at}:null,now);
 const distance=Math.round(distanceMiles({lat:search.lat,lon:search.lon},{lat:row.latitude,lon:row.longitude})*10)/10;
 const unknowns:string[]=[];let match=true;
 if(search.careType&&row.care_type!==search.careType)match=false;if(search.radius&&distance>search.radius)match=false;
 if(search.species&&speciesFit==='unknown'){unknowns.push('Species support unconfirmed');if(!search.includeUnknown)match=false;}
 if(search.service&&serviceFit==='unknown'){unknowns.push('Requested service unconfirmed');if(!search.includeUnknown)match=false;}
 if(search.intake){if(availability.state==='unknown'){unknowns.push('Current intake unconfirmed');if(!search.includeUnknown)match=false;}else if(availability.state!=='accepting')match=false;}
 if(search.maxFeeCents!==undefined&&row.care_type!=='emergency'){if(row.exam_fee_max_cents===null){unknowns.push('Published exam fee unconfirmed');if(!search.includeUnknown)match=false;}else if(row.exam_fee_max_cents>search.maxFeeCents)match=false;}
 if(search.payment&&row.care_type!=='emergency'){if(!row.payment_options.length){unknowns.push('Payment option unconfirmed');if(!search.includeUnknown)match=false;}else if(!row.payment_options.map((v:string)=>v.toLowerCase()).includes(search.payment.toLowerCase()))match=false;}
 return {id:row.id,name:row.name,careType:row.care_type,address:row.address,phone:row.phone,distanceMiles:distance,species:row.species,services:row.services,speciesFit,serviceFit,source:row.source_label,sourceUrl:row.source_url,demo:row.demo,fictional:row.fictional,receivesRequests:row.receives_requests,city:row.city,state:row.state,postalCode:row.postal_code,website:row.website,hours:row.hours_text,examFeeMinCents:row.exam_fee_min_cents,examFeeMaxCents:row.exam_fee_max_cents,examFeeScope:row.exam_fee_scope,paymentOptions:row.payment_options,sourceVerifiedAt:row.source_verified_at,unknowns,match,
 availability:{state:availability.state,restriction:availability.restriction,observedAt:availability.state==='unknown'?null:row.observed_at,expiresAt:availability.expiresAt}};}).sort((a,b)=>a.distanceMiles-b.distanceMiles);
 const matched=providers.filter(p=>p.match);return {providers:matched.length?matched:providers.slice(0,10),alternatives:matched.length===0&&providers.length>0};
}
