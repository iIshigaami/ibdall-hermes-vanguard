# Third-party materials and publication boundary

## Original work

`controller.js` was newly authored with Hermes Agent for the `ibdall-hermes-vanguard` entry. It implements the documented controller contract; the official starter is not incorporated. README and operational helper `battle_api.py` were authored for this project. No third-party controller policy was copied.

The project's own `controller.js` and documentation are published as the authorized deliverable. No separate license has been selected on the owner's behalf, so downstream reuse rights should be set explicitly by the owner before reuse.

## Official tools used locally, not redistributed

Provider/operator: battle.training / Euler's Identity, LLC.

- Controller interface: https://api.battle.training/docs/controller-api.md
- Official starter consulted: https://api.battle.training/starters/controller.js
- Official engine: https://api.battle.training/sdk/arena-sim.mjs
- Official harness: https://api.battle.training/sdk/local-test.mjs
- Official competition instructions: https://api.battle.training/llms.txt

The official instructions explicitly direct entrants to download and run these tools for local testing. That supports the local testing workflow; it is not a general redistribution or relicensing grant. Inspected tool files contained no license/copyright notice and no explicit redistribution license was located on the inspected official pages. Accordingly no MIT, Apache or other license is attributed to them. The publication bundle excludes the engine, harness, official starter and downloaded documentation. Obtain them directly from the provider for testing. If future publication includes them or substantial source excerpts, confirm the applicable license or request permission first, then preserve all required notices.

## Evidence

Test logs were produced by executing the official harness on this project's controller. Saved JSON files are public API responses concerning this bot or this bot's scrimmages. They contain no account key or account claim URL. Attribution here identifies the measurement tools and arena; no endorsement is implied.

## Secrets and operator-only files

Never publish `account.json` or any account claim link. Do not publish operator logs wholesale. The `publish/` directory is an allowlisted bundle, not a mirror of the operational workspace. No credentials, third-party executable source or helper capable of reading credentials are included.
