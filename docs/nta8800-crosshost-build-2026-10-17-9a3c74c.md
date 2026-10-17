# NTA 8800 CSP-volgordeherbouw — 17 oktober 2026

Broncommit `9a3c74cb1222fcdc972d60badfebea21c08db9a0` voegt een lokale, gelicentieerde kopie van `tauri-codegen` 2.5.5 toe. De enige bronwijziging sorteert embedded-assetpaden en CSP-hashes voordat de Rust-tokens worden gevormd. De hashes en de CSP-regels zelf blijven behouden. De voorgaande [cross-host-bouw](nta8800-crosshost-build-2026-10-16-0d4e239.md) wees een permutatie van dezelfde 25 CSP-hashes aan als het enige inhoudelijke verschil in de desktop-ELF.

De gerichte `tauri-codegen`-test, `cargo check --locked` voor de desktop en negen Python-bouwbewijstests slaagden. Twee lokale vaste-layout-builds van deze commit begonnen elk met een schone checkout, Cargo-cache en `npm ci`. De brongebonden manifestlezer verifieerde beide sets en vond alle vier artefacten en de manifesten bytegelijk. Beide manifesten hebben SHA-256 `d642f4c49d456c90b321ff20d32d817f289b009165e502218a53421c2a5bdcf2`.

| Artefact | Bytes | SHA-256 |
| --- | ---: | --- |
| API | 229 021 208 | `e8f0a69035d8d5e86deb3a8981aaac10498475cdb9bccbcc8a9144300027148e` |
| Desktop `.deb` | 89 080 798 | `ec08f2b33da7b09fdad6f4fe8dfda5d3f2420a571b7e1311fbd444a1d0e6db12` |
| MCP | 259 189 784 | `91d5f0f4bbaeaf34f8a0f1f5ce4424143d79e6b3b386434aa6d3780baaad5c59` |
| Referentiegate | 222 875 336 | `bcb2c94333a736612caa447170f8f953d3aedfb65b8df7d439fa72e1a5f3f6d7` |

[GitHub-run 39069457147](https://github.com/Erika98-be/open-energy-studio/actions/runs/39069457147) bouwt dezelfde commit op een afzonderlijke Ubuntu-runner. De download en bytevergelijking met de lokale set staan nog open. Deze technische bouwproef stelt geen officiële NTA-referentieuitkomsten of attestering vast; de manifesten houden `referenceVerified=false` en `attestStatus=unattested`.
