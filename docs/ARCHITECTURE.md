# Architecture and boundaries

The work-in-progress application is a Next.js modular monolith backed by PostgreSQL. Public search uses an allowlisted projection; raw case data, staff coverage, credentials, and internal notes are not returned by the public directory. Precise browser coordinates are sent in the request body for search and are not placed in URLs or analytics.

Better Auth supplies database-backed sessions. Public staff signup is disabled. Managers create single-use, expiring invitations for a particular location and role; the invitation link is displayed once and no email is sent automatically. Server endpoints check sessions, location memberships, and role permissions. Clinical assessment and handoff decisions require clinician membership; a platform administrator has no automatic case access. Case links use random tokens stored as hashes, expire, and show only owner-visible updates. The case and invite pages use no-referrer headers and remove the fragment from the visible URL after loading.

Staff availability changes use revision checks and a transaction containing the assertion, audit entry, and outbox event. Read-time expiry makes old status unknown even if the worker is down. Public and clinic views poll at five-second intervals in this early implementation. The worker processes supported outbox events into in-app staff notifications and schedules source reads; an outbox item marked processed is not proof of SMS or email delivery.

Directory sources and source rows preserve stable IDs and source snapshots. Imports validate before a transaction, serialize on the source row, retain locked fields, and mark missing rows for review rather than deleting providers. A changed source revision invalidates a stale preview. A separate demo database identity gates simulation and demo assignment controls. More granular provenance, conflict resolution, retention, and support-access grants remain incomplete.

This architecture is not a security or clinical certification. See BUILD_STATUS.md before use.
