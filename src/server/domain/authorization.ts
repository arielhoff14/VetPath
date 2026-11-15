export type Role = 'reception' | 'clinician' | 'manager' | 'platform_admin';
export type Permission = 'view_case' | 'manage_intake' | 'assess' | 'manage_availability';
export interface Membership { role: Role; locationIds: string[]; active: boolean }

/** Platform administration does not grant access to a clinic's private case data. */
export function permits(membership: Membership | null, locationId: string, permission: Permission): boolean {
  if (!membership?.active || !membership.locationIds.includes(locationId) || membership.role === 'platform_admin') return false;
  if (permission === 'assess') return membership.role === 'clinician';
  if (permission === 'manage_availability') return membership.role === 'manager' || membership.role === 'clinician';
  return true;
}
