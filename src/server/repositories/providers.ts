import { Pool } from 'pg';
import { currentAvailability, distanceMiles, matchesCapability, type Fact, type IntakeState } from '../domain/discovery';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export interface Search { lat: number; lon: number; species?: string; careType?: string; includeUnknown: boolean; }
/** Deliberately selects only public, allowlisted fields. No patient, staff, or contact records are returned. */
export async function searchProviders(search: Search) {
  const result = await pool.query(`SELECT p.id,p.name,p.care_type,p.address,p.phone,p.latitude,p.longitude,p.species,p.services,p.source_label,p.source_url,p.demo,
    a.state AS intake_state,a.restriction,a.observed_at,a.expires_at
    FROM provider_locations p LEFT JOIN LATERAL (SELECT state,restriction,observed_at,expires_at FROM availability_assertions WHERE location_id=p.id ORDER BY observed_at DESC,id DESC LIMIT 1) a ON true`);
  const now = new Date();
  return result.rows.flatMap((row) => {
    if (search.careType && row.care_type !== search.careType) return [];
    const species: Fact = !search.species ? 'unknown' : row.species.length === 0 ? 'unknown' : row.species.includes(search.species) ? 'yes' : 'no';
    if (!matchesCapability(species, Boolean(search.species), search.includeUnknown)) return [];
    const availability = currentAvailability(row.intake_state ? {state:row.intake_state as IntakeState,restriction:row.restriction,expiresAt:row.expires_at} : null, now);
    return [{id:row.id,name:row.name,careType:row.care_type,address:row.address,phone:row.phone,
      distanceMiles:Math.round(distanceMiles({lat:search.lat,lon:search.lon},{lat:row.latitude,lon:row.longitude})*10)/10,
      species:row.species,services:row.services,speciesFit:species,source:row.source_label,sourceUrl:row.source_url,demo:row.demo,
      availability: {state:availability.state,restriction:availability.restriction,observedAt: availability.state === 'unknown' ? null : row.observed_at,expiresAt:availability.expiresAt}}];
  }).sort((a,b) => a.distanceMiles - b.distanceMiles);
}
