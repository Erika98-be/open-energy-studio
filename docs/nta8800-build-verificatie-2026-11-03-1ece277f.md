# NTA 8800 Linux-devbouwbewijs — 3 november 2026

De handmatig gestarte [GitHub Actions-run 41559173881](https://github.com/Erika98-be/open-energy-studio/actions/runs/41559173881) bouwde commit `1ece277f4f47e96a2e790a6fdd347cd22dbcfae8` via `scripts/build-nta-fixed-layout.py`. De workflow slaagde. Zij gebruikte Ubuntu 24.04, Node 24.21.0, npm 12.2.0, Python 3.11 en Rust 1.99.0. De Python-tests voor de manifestcode, de bouw van het Linux-debugpakket en de API-, MCP- en referentiegate-binaries, en `verify-nta-build.py --source-repo .` slaagden in dezelfde run.

Het manifest heet `oes-nta8800-build_1ece277_linux-amd64.json` en heeft SHA-256 `beb26879c4d19530a0d9e0e8446dcc350d404ddd3b514155c6897ed40d92a41e`. Het workflow-artefact `nta-8800-linux-dev-build` omvat volgens GitHub 208433771 bytes en verloopt op 3 december 2026. De vijf bestanden zijn uit GitHub Actions naar de lokale ontwikkelhost gedownload. `sha256sum` bevestigde de manifesthash uit de runlog; `python3 scripts/verify-nta-build.py <manifest> --source-repo .` controleerde daar de vier artefactbytes en de bronmetadata tegen commit `1ece277f` en slaagde.

Daarna is **dezelfde commit afzonderlijk lokaal gebouwd** op Linux Mint 22.3 met `scripts/build-nta-fixed-layout.py`, vanuit een schone, afgekoppelde Git-werkboom. De Node 24.21.0-download is tegen de door Node gepubliceerde SHA-256-lijst gecontroleerd; npm 12.2.0 en Rust 1.99.0 waren op `PATH` actief. De lokale Python-versie was 3.12.3 tegenover 3.11 op de runner. De lokale bouw gebruikte `npm ci`, een nieuwe Cargo-cache, `CARGO_INCREMENTAL=0` en dezelfde vaste bronlayout als de runner. `verify-nta-build.py --source-repo . --compare-with <runner-manifest>` controleerde vervolgens beide manifests en alle vier bestanden: **API, MCP, referentiegate en Linux-debug-`.deb` zijn bytegelijk** tussen de lokale host en de GitHub-runner. Ook de manifests hebben dezelfde SHA-256 hierboven.

| Artefact | Bytes | SHA-256 op beide hosts |
| --- | ---: | --- |
| API | 229739168 | `7374c75ef4eaf9276ccf3e81694580672a341bea1a4b0838a58126a0b4b820e2` |
| MCP | 259908048 | `d202703a447087bd50b55883602ac355d6c9b5fceda80e270e964b749f6b1b0b` |
| Referentiegate | 223724024 | `a281ec3956a42eeee64278a7a26cf2a37b28ad4649fb8c360dcc6a002a7fb6b8` |
| Desktop `.deb` | 89146684 | `b4a334c0890962b73a281b372e6f4debde542a709c6e155709013835b1660641` |

Dit bewijst bytegelijke uitvoer voor deze Linux-debugprocedure en commit op twee bouwhosts; andere toolchains en platforms zijn niet zo vergeleken. De officiële NTA-referentiegevallen, visuele desktopacceptatie en externe attestering blijven open. Een bytegelijke bouw geeft geen NTA-conformiteit vrij.
