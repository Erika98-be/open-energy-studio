# NTA 8800 Linux-devbouwbewijs — 21 november 2026

Broncommit: `211e6c87c718a3676defab0b6edc5bd55786624e`. Twee afzonderlijke [GitHub Actions-runs 44836787939](https://github.com/Erika98-be/open-energy-studio/actions/runs/44836787939) en [44836797144](https://github.com/Erika98-be/open-energy-studio/actions/runs/44836797144) slaagden met de vaste Linux-debugbouw, de bouwbewijstests en de manifestcontrole. Dezelfde broncommit is op een afzonderlijke lokale Linux-host gebouwd met `scripts/build-nta-fixed-layout.py --output-dir /tmp/oes-local-2026-11-21`.

De drie artefactsets zijn afzonderlijk gecontroleerd met `python3 scripts/verify-nta-build.py <manifest> --source-repo .`. De vier uitvoerbare artefacten zijn over alle drie de builds bytegelijk:

| Artefact | Bytes | SHA-256 in alle drie builds |
| --- | ---: | --- |
| HTTP-API | 230824088 | `21f4476deb6b5c3794ae2a6afb2927c4d02a501d9b443e132db95e84075f15be` |
| MCP | 260995656 | `b62ee4dc1e74f3c3d004ab496bf3629d588736d92c5d77b2ea1c3d5e8b833560` |
| Referentiegate | 224811344 | `017cd2f88d3985d02bff0165f73523febb86e0421c3522fd61e2f193546a3a07` |
| Desktop `.deb` | 89863132 | `12aa79ffaa1ce2616c88c36c16b97237ffcfc32d34d4c1a7632eeeb5140d9924` |

De twee GitHub-manifesten zijn ook bytegelijk (`1c37e8f6bd6815e895f14480437f10dae0560b54b882393860326658d8408b99`). Het lokale manifest verschilt alleen in het geregistreerde Node-versienummer: lokaal `v24.22.3`, op GitHub `v24.21.0`; de lokale manifesthash is `c86468fb3b8d90c0273fcc971758feaa3baeca09642b32d7874ed831545f5974`. Beide omgevingen gebruikten npm `12.2.0` en Cargo/Rust `1.99.0` volgens hun manifesten.

Dit toont reproduceerbare bytes voor deze broncommit en vaste Linux-bouwprocedure op twee GitHub-runners en een afzonderlijke lokale host. Het bewijst geen bytegelijkheid voor Windows- en macOS-installers en geen normatieve juistheid. De manifesten blijven `referenceVerified=false` en `attestStatus=unattested`; onafhankelijke normreferentiegevallen en formele externe toets ontbreken.
