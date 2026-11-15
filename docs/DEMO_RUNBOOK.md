# Demo runbook

Use an isolated database. Run `pnpm bootstrap` after installing dependencies and starting Docker. It creates local secrets, applies migrations, marks an empty database as demo, seeds eight fictional provider locations, and creates one demo manager if absent. The generated password is displayed once. It never resets an existing database. Start `pnpm dev` and `pnpm worker` in separate terminals; the worker needs the same DATABASE_URL and VETPATH_ENV environment values.

1. Open the home page, search San Jose, and choose Send details on Demo Willow Emergency. Enter synthetic information only. Save the owner case link.
2. Sign in at `/clinic` using the generated account. The request appears for Demo Willow Emergency. Acknowledge it and enter an owner-visible update. Open the private owner link to view it.
3. Change availability in the clinic workspace. The search results update through five-second polling and an expired assertion becomes unknown.
4. At `/admin`, create a fictional internal source. Use the grid or import the synthetic CSV, preview it, and apply it. Re-importing uses the same stable IDs. A demo administrator can assign themselves a simulated role at another demo location.

Current limitations: demo reset, fully replayable handoff/source-failure scenarios and scenario controls are not yet implemented. Do not enter real patient information. Fictional providers have no phone actions.
