# VetPath

VetPath is an early-stage project intended to help people find veterinary care and help clinics coordinate incoming cases. **This code is incomplete and must not be used for real patients, clinical decisions, or public care operations.** See [build status](docs/BUILD_STATUS.md).

A separate [landing page](https://vetpath-care-demo.aheadchime1.chatgpt.site) demonstrates the concept. Its Google Maps search does not represent a connected clinic directory.

## Developer setup (early foundation)

Prerequisites: Node.js 24, pnpm, Docker with Compose. From the project folder:

1. Run `pnpm install` and follow pnpm's prompts about build scripts.
2. Copy `.env.example` to `.env.local` and create a long random `BETTER_AUTH_SECRET`. The auth service is not implemented yet.
3. Start PostgreSQL with `docker compose up -d`.
4. Export `DATABASE_URL=postgresql://vetpath:vetpath@localhost:5432/vetpath` in your terminal. Run `pnpm db:migrate`.
5. For an isolated demo database only, run `VETPATH_ENV=demo pnpm db:seed:demo`.
6. Run `pnpm dev` and open the displayed localhost address. `pnpm test` runs the current unit tests.

These steps have not yet been tested against PostgreSQL on the development host. Do not use the example credentials or demo data in production.
