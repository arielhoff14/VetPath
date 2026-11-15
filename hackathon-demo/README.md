# VetPath hackathon demo

This folder is the source of the public hackathon demo at https://vetpath-care-demo.aheadchime1.chatgpt.site. It is separate from the in-progress PostgreSQL pilot in the repository root.

The owner directory shows a curated snapshot of 27 public website references from the founder-provided research; the unresolved Sacramento branch was not added. Only four entries have separately checked contact details. Current intake is unknown for real providers. No interview notes, real patient data, or hospital partnership claims are included. The spreadsheet is not connected or automatically synced in this demo.

The clinic board, roles, cases, status and insights are a shared simulation. Roles are not authenticated; anyone with the public link may change the fictional data. The demo accepts predefined cases only and must not be used for real cases or clinical decisions. Staff work and availability updates persist in the site's D1 database and refresh every five seconds.

For a disposable local preview, install Node.js 24, run `node scripts/preview.mjs` inside this folder, and open http://127.0.0.1:4317. The preview uses an in-memory SQLite database and resets when stopped. Run `node scripts/test-worker.mjs` for the worker tests. After editing `ui.html`, `worker/base.js`, or `provider-reference.csv`, run `python3 scripts/compile-worker.py`, then `bash scripts/build.sh` and `node scripts/validate-artifact.mjs`.

Hosted deployment is managed through the existing Sites project in `.openai/hosting.json`; the source and D1 migration must be deployed together. Do not change an applied migration. The root application is a separate incomplete pilot and must not be treated as production-ready.

The revised prototype requests browser geolocation on demand and uses approximate city-center distances for four reference clinics with known cities. All other distances and real clinic capabilities remain unknown. The fictional pet description is processed in the browser by simple keyword rules, not a language model; no AI service is configured. Only predefined species and care categories are sent to the shared demo clinic. The fictional schedule is an illustrative day, not a booking system. The shared simulation is unauthenticated and must not contain real patient information.

Hospital activity and intake can be updated only for the fictional shared clinic, and expire after one hour. Owner priorities can be reordered or switched off. Real fee, reported activity and specialty/species information is incomplete; unknowns do not become fabricated facts. Four providers have sourced contact details and services.

The phone-first revision shows founder-supplied public contact details and only one exam fee with an explicit sharing indication in the supplied research. Other prices remain unverified. City-center distances are approximate. Hospital activity and pre-arrival intake remain fictional: no real hospital is connected, roles are unauthenticated, and the server rejects arbitrary patient information. Staff notes and intake fields are predefined examples. Owner reports expire after two hours; staff reports expire after three. The sign-in providers, real intake, reviews, payment partners and photo upload are unconfigured. No AI model is connected. This is not ready for real patient data or clinical use.
