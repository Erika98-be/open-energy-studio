# NTA 8800 vaste-layout-bouwproef — 16 oktober 2026

Broncommit: `0d4e2390c1ea2fe245d73da7d408f056d3774c00`. De bouw van [deze commit](https://github.com/Erika98-be/open-energy-studio/commit/0d4e2390c1ea2fe245d73da7d408f056d3774c00) gebruikt een eigen checkout en Cargo-cache onder `/tmp/oes-nta8800-evidence`, een vast Rustup-pad en `CARGO_INCREMENTAL=0`. De Rust-compiler remapt deze vaste paden naar `/workspace`, `/cargo` en `/rustup`. De Python-bouwbewijssuite slaagde met negen tests; de CI-workflow is als YAML geparseerd.

Twee lokale Linux-debugbuilds zijn elk met een verse `npm ci`, eigen checkout en schone Cargo-cache uitgevoerd. De manifestlezer bevestigde de pakket-, byte- en bronmetadata tegen deze commit en vond pakket, drie servicebinaries en zelfs beide manifesten bytegelijk. Hun manifest-SHA-256 is `b35409552bdf0aeb75d1612130134f940a35fee60ac2c27e9a5270d9abd5961d`. De manifesten registreren `buildLayout=fixed_tmp_v1`, Node 24.21.0, npm 12.2.0, rustc/Cargo 1.99.0, de vier lockhashes, `sourceDateEpoch=1792157811`, `referenceVerified=false` en `attestStatus=unattested`.

| Artefact | Lokale bytes | Lokale SHA-256 |
| --- | ---: | --- |
| API | 229021208 | `e8f0a69035d8d5e86deb3a8981aaac10498475cdb9bccbcc8a9144300027148e` |
| Desktop `.deb` | 89036464 | `b582570385f80881aa9675d7720fd27a618efcc9b86e310d35258f99dd10bdbe` |
| MCP | 259189784 | `91d5f0f4bbaeaf34f8a0f1f5ce4424143d79e6b3b386434aa6d3780baaad5c59` |
| Referentiegate | 222875336 | `bcb2c94333a736612caa447170f8f953d3aedfb65b8df7d439fa72e1a5f3f6d7` |

De lokale API bevat geen `/home/aia04`- of `/tmp/oes-nta8800-evidence`-padbytes; `/workspace` en `/cargo` komen wel voor. De vaste layout verkleint vooral het verschil in debugbestandsgrootte tegenover de vorige runnerproef, maar een vergelijking met [GitHub-run 38909208019](https://github.com/Erika98-be/open-energy-studio/actions/runs/38909208019) moet nog worden uitgevoerd. Bytegelijke cross-host-reproduceerbaarheid is daarom nog niet vastgesteld.

Deze bouw levert geen officiële NTA-referentietoets of extern attest op.
