/** Rules shared by the directory and future import/availability services. */
export type Fact = 'yes' | 'no' | 'unknown';
export type IntakeState = 'accepting' | 'restricted' | 'not_accepting' | 'unknown';
export interface Availability {
  state: IntakeState;
  expiresAt: Date | null;
  restriction: string | null;
}

/** Expired or undated operational reports must never be presented as current. */
export function currentAvailability(value: Availability | null, now: Date): Availability {
  if (!value?.expiresAt || value.expiresAt.getTime() <= now.getTime()) {
    return { state: 'unknown', expiresAt: null, restriction: null };
  }
  return value;
}

/** Unknown capabilities are retained unless the owner opts into a strict filter. */
export function matchesCapability(value: Fact, required: boolean, includeUnknown: boolean): boolean {
  return !required || value === 'yes' || (includeUnknown && value === 'unknown');
}

export function distanceMiles(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (degrees: number) => degrees * Math.PI / 180;
  const deltaLat = rad(b.lat - a.lat), deltaLon = rad(b.lon - a.lon);
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(deltaLon / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
