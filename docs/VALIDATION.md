# Validation record

Local checks cover strict type checking, linting, production build, parser and rule tests, PGlite-backed authorization, state-transition and data-integrity tests, and a synthetic owner-to-clinic browser flow. GitHub Actions runs migrations and tests on PostgreSQL 17, including a concurrent slot confirmation test and a Sheets adapter fixture. A successful CI run verifies only the code at that run's commit.

Still required: full independent-browser acceptance coverage, external credential tests, penetration/security review, operational recovery exercises, accessibility assessment, load testing, and qualified clinical review. PGlite tests are not a replacement for production PostgreSQL concurrency tests.
