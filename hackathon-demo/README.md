# VetPath hackathon demo

This folder is the source of the public hackathon demo at https://vetpath-care-demo.aheadchime1.chatgpt.site. It is separate from the in-progress PostgreSQL pilot in the repository root.

The owner directory shows a curated snapshot of 27 public website references from the founder-provided research; the unresolved Sacramento branch was not added. Only four entries have separately checked contact details. Current intake is unknown for real providers. No interview notes, real patient data, or hospital partnership claims are included. The spreadsheet is not connected or automatically synced in this demo.

The clinic board, roles, cases, status and insights are a shared simulation. Roles are not authenticated; anyone with the public link may change the fictional data. The demo accepts predefined cases only and must not be used for real cases or clinical decisions. Staff work and availability updates persist in the site's D1 database and refresh every five seconds.

For a disposable local preview, install Node.js 24, run `node scripts/preview.mjs` inside this folder, and open http://127.0.0.1:4317. The preview uses an in-memory SQLite database and resets when stopped. Run `node scripts/test-worker.mjs` for the worker tests. After editing `ui.html`, `worker/base.js`, or `provider-reference.csv`, run `python3 scripts/compile-worker.py`, then `bash scripts/build.sh` and `node scripts/validate-artifact.mjs`.

Hosted deployment is managed through the existing Sites project in `.openai/hosting.json`; the source and D1 migration must be deployed together. Do not change an applied migration. The root application is a separate incomplete pilot and must not be treated as production-ready.
