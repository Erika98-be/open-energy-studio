# NTA 8800 Linux-devbouwbewijs — 9 november 2026

De handmatig gestarte [GitHub Actions-run 42696446489](https://github.com/Erika98-be/open-energy-studio/actions/runs/42696446489) bouwde commit `addb14c38ec98ecfd8b4eca4aa91e6b64c282151` met `scripts/build-nta-fixed-layout.py`. De workflow slaagde, inclusief de Python-tests voor de manifestcode, de Linux-debugbouw van desktop, API, MCP en referentiegate, en de bron- en bytecontrole. De runner gebruikte Ubuntu 24.04, Node 24.21.0, npm 12.2.0, Python 3.11 en Rust 1.99.0. De reguliere [NTA-CI op dezelfde commit](https://github.com/Erika98-be/open-energy-studio/actions/runs/42585936308) slaagde ook met de Linux-, Windows- en macOS-desktopbuilds.

Het runnerartefact `nta-8800-linux-dev-build` omvat volgens GitHub 208440026 bytes en verloopt op 9 december 2026. De vijf bestanden zijn lokaal gedownload naar `/tmp/oes-nta-evidence-42696446489`. Het manifest `oes-nta8800-build_addb14c_linux-amd64.json` heeft SHA-256 `b0259d6b78f41daae247406369fc6b484ce369dfd32375dc7a07ec0bf3cdf2ab`. `scripts/verify-nta-build.py --source-repo .` bevestigde de vier artefactbytes en de bronmetadata tegen de vastgelegde commit.

Dezelfde commit is daarnaast afzonderlijk gebouwd op Linux Mint 22.3 met de vaste bronlayout, Node 24.21.0, npm 12.2.0 en Rust 1.99.0. De lokale Python-versie was 3.12.3. De bouw begon vanuit de schone `main`-werkboom en gebruikte opnieuw `npm ci` en een lege tijdelijke Cargo-cache. `scripts/verify-nta-build.py` controleerde beide manifests met `--compare-with`: het manifest en alle vier artefacten zijn bytegelijk tussen runner en lokale host.

| Artefact | Bytes | SHA-256 op beide hosts |
| --- | ---: | --- |
| API | 229751464 | `81e5bde4939d71e68470fa42320d11b4c82140b99322379776477525e1185f06` |
| MCP | 259923448 | `a2703aae7295266be2f70080fc120a57322fb0879c1f6eae957f9843c0677cc6` |
| Referentiegate | 223739440 | `f2245103ea54935a4c6dac9c671771c7dce153959f4a6be01a088dfba36daf7a` |
| Desktop `.deb` | 89189674 | `69559c1f18f529c752624429ac73b8678ae66acd0151e77d6d0b3f76d376acbc` |

Deze vergelijking bewijst bytegelijke uitvoer voor deze specifieke Linux-debugprocedure en broncommit op twee hosts. Zij bewijst geen reproduceerbaarheid van andere toolchains of platforms, geen visuele desktopacceptatie en geen normconformiteit. Het manifest houdt `referenceVerified=false` en `attestStatus=unattested`; actuele onafhankelijke NTA-referentiegevallen en externe attestering ontbreken.
