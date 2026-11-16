# ibdall-hermes-vanguard

**Disclosure:** This AI-assisted project was built with Hermes Agent (`hermes-agent`, model `gpt-6.1-sol`) as an entry for a **paid promotional campaign** on promotedby.ai for battle.training. Compensation is conditional; no bounty payment or prize is claimed here.

An original JavaScript controller for battle.training's Armor ruleset `s2.0.0`.

- **Public bot:** https://battle.training/bots/ibdall-hermes-vanguard
- **Public bot JSON:** https://api.battle.training/api/bots/ibdall-hermes-vanguard
- **Active version:** `v1-wavefront` (`controller.js` SHA-256 `8fd65e128c1fccadd069c62dddb2135ec958d92fac39af5cbc673d0c70a7675f`)
- **Cup:** https://battle.training/cup/promotedby-cup-nov-2026
- **Repository:** https://github.com/iIshigaami/ibdall-hermes-vanguard

## What the controller does

It drafts two APCs, an MBT and a scout within the 12-point budget. It precomputes a four-connected reverse distance field for each objective, using passability from the supplied rules rather than driving directly into rivers. Short line-of-travel checks smooth those routes. APCs maintain separate garrisons, while the tank and scout choose objectives using distance, weight, existing APC coverage and nearby contacts. Direct-fire weapons lead visible moving targets. Units attempt to leave incoming artillery footprints.

The controller is deterministic policy code: no network requests, model calls or external services run during a match. The source was written for this entry; it is not a renamed copy of the official starter.

## Measured results

These are **local game results, not ranked sets**, recorded on 2026-11-15. Each of five deterministic seeds was played from both sides against each of four house styles: 40 games in total. The final controller source was used for this run.

| Opponent | Wins | Losses | Draws |
| --- | ---: | ---: | ---: |
| brawler | 9 | 1 | 0 |
| holder | 10 | 0 | 0 |
| random | 10 | 0 | 0 |
| hunter | 8 | 2 | 0 |
| **Total** | **37** | **3** | **0** |

- Win rate: **92.5%** on this small, public-seed test matrix. This is not a forecast of ladder performance.
- Replay verification: **40/40** passed by re-simulating recorded orders.
- Tick exceptions: **0**; aborted matches: **0**.
- Refused orders: **0.6 per game** (rounded by the harness).
- Damage dealt/taken: **228/273 per game** (rounded by the harness).
- Full output: [`test-v2.log`](test-v2.log). Initial smaller test: [`test-v1.log`](test-v1.log).

Node profiling warned about wall-time spikes: p99 tick 0.429 ms, max 119.667 ms; hello max 80.522 ms. These local Android/Node timings are not QuickJS CPU measurements. Actual server upload validation passed 400 ticks with **zero failures, exceptions or timeouts** (maximum tick budget used 1 of 40; maximum any-call budget 73 of the hello limit 4000). See [`upload-v1-wavefront.json`](upload-v1-wavefront.json).

A completed **unrated** real-server scrimmage against `house-hunter`, seed `78123451`, won **2–0** with sides swapped. Its 6,528 total ticks reported **zero sandbox failures, timeouts or exceptions** and zero refused orders. This does not contribute to ranked qualification. Saved result: [`scrimmage-result.json`](scrimmage-result.json). Viewer: https://battle.training/watch?match=scr_47a1ee0124a7 (scrimmages expire after seven days).

A second completed **unrated** server scrimmage against the pinned `house-starter` panel member R2 (`starter-2`), seed `9742013`, also won **2–0** with swapped sides. Its 3,242 total ticks reported zero sandbox failures, timeouts, exceptions and refused orders. Saved result: [`starter-scrimmage-result.json`](starter-scrimmage-result.json). Viewer: https://battle.training/watch?match=scr_1396c79953a3. These two scrimmages are validation checks, not ranked sets.

## Cup and campaign status

Free cup entry was accepted and read back from both the cup standings and bot endpoint. At the latest recorded readback, **public ranked sets = 1 (1 win), rating 1232 ± 300; cup sets = 1 (1 loss), rating 1168 ± 303**. The public house-starter rating was 727 ± 25, so the bot's raw rating was above that baseline, but uncertainty is large and its leaderboard score was still lower (632 versus 677). The requirement for **100 rated sets has not been met**. Initial ratings and one ranked set are not evidence of sustained strength. See [`enrol-response.json`](enrol-response.json), [`bot-readback.json`](bot-readback.json) and [`house-starter-readback.json`](house-starter-readback.json); follow the live API for newer results.

Live snapshot read on 2026-11-16: **public rank 130/269, rating 1310 ± 61, score 1187, sets 35 (17 W, 12 L, 6 D)**; **November Cup rank 110, rating 1199 ± 45, score 1109, sets 62 (23 W, 27 L, 12 D), still 38 sets short of the 100-set eligibility threshold**. Active version remains `v1-wavefront`, with **0 timeouts, 0 exceptions and 0 idle ticks** reported by the live bot endpoint. A ranking is not a prize result.

GitHub publication is complete: this curated bundle is published at **https://github.com/iIshigaami/ibdall-hermes-vanguard**. The repository contains only the project source and supporting evidence. No promotional post was made. Do not publish campaign promotion to Reddit or dev.to.

## Reproduce the local tests

Requires Node.js with ES modules support, plus `curl` for obtaining the official test tools. In a directory containing this project's `controller.js`:

```sh
curl --fail --location --output arena-sim.mjs https://api.battle.training/sdk/arena-sim.mjs
curl --fail --location --output local-test.mjs https://api.battle.training/sdk/local-test.mjs
node local-test.mjs controller.js --seeds 5 --vs brawler,holder,random,hunter --rules s2 --profile
```

The harness chooses seeds as `(s * 2654435761) >>> 0` for `s = 1..5`, plays both sides, and verifies each replay. Downloaded tools may change; archived results describe the tools used for this run. They are not included in the publication bundle because their redistribution license could not be confirmed.

## Upload and monitor

The arena expects the whole `controller.js` file as the `source` field when posting a uniquely labeled version to `/api/bots/<name>/versions`, authenticated with the account's Bearer key. Read the bot endpoint afterward to confirm that the upload passed smoke testing and became active. Cup entry is separate from version upload and costs nothing for this cup.

Do not commit account keys, claim links, wallet secrets or local credential files. This project's local `battle_api.py` is an operator helper, not part of the publication bundle, and reads `account.json` without printing its key. Never upload the working directory wholesale; publish only the curated `publish/` files.

## Sources and rights

The interface and rules were consulted at https://api.battle.training/docs/controller-api.md. The official starter was read for API orientation but not copied into this controller. The simulator and harness were downloaded from battle.training's official `/sdk/` URLs and executed solely for testing, as instructed by its documentation. Credit: **battle.training / Euler's Identity, LLC** for the arena, documentation and testing tools.

No explicit SDK/starter redistribution license was found in the inspected local files or official pages. **No permissive license is asserted for those third-party materials.** They, the downloaded API documentation and official starter are deliberately excluded from the publication bundle. Fetch tools from their original URLs for local testing and review their terms before any redistribution. The original project source and documentation are prepared without relicensing third-party files. See [`THIRD_PARTY.md`](THIRD_PARTY.md).

## Limits

Only Armor `s2.0.0` was tested. Path costs currently count tiles rather than terrain travel time; bridge destruction and vehicle congestion are not globally replanned. A small public-seed matrix can overstate generalization. The real ladder, additional unseen seeds and completed ranked results are the next evidence needed, not assumptions to substitute with local wins.
