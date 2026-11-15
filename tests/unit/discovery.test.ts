import { describe, expect, it } from 'vitest';
import { currentAvailability, distanceMiles, matchesCapability } from '../../src/server/domain/discovery';
import { permits } from '../../src/server/domain/authorization';

describe('safe discovery rules', () => {
  it('expires old availability instead of claiming a clinic is accepting', () => {
    expect(currentAvailability({state:'accepting', expiresAt:new Date('2026-01-01T00:00:00Z'), restriction:null}, new Date('2026-01-01T00:00:00Z')).state).toBe('unknown');
    expect(currentAvailability({state:'restricted', expiresAt:new Date('2026-01-02T00:00:00Z'), restriction:'Call first'}, new Date('2026-01-01T00:00:00Z')).restriction).toBe('Call first');
  });
  it('distinguishes unknown from no when filtering', () => {
    expect(matchesCapability('unknown', true, true)).toBe(true);
    expect(matchesCapability('unknown', true, false)).toBe(false);
    expect(matchesCapability('no', true, true)).toBe(false);
  });
  it('calculates approximate straight-line distance', () => {
    expect(distanceMiles({lat:37.3382,lon:-121.8863}, {lat:37.3382,lon:-121.8863})).toBe(0);
    expect(distanceMiles({lat:37.3382,lon:-121.8863}, {lat:37.7749,lon:-122.4194})).toBeCloseTo(41.7, 0);
  });
});
describe('location authorization', () => {
  it('rejects cross-location and administrator access to private cases', () => {
    expect(permits({role:'reception',locationIds:['a'],active:true},'b','view_case')).toBe(false);
    expect(permits({role:'platform_admin',locationIds:['a'],active:true},'a','view_case')).toBe(false);
  });
  it('reserves assessment for clinicians', () => {
    expect(permits({role:'reception',locationIds:['a'],active:true},'a','assess')).toBe(false);
    expect(permits({role:'clinician',locationIds:['a'],active:true},'a','assess')).toBe(true);
    expect(permits({role:'clinician',locationIds:['a'],active:false},'a','assess')).toBe(false);
  });
});
