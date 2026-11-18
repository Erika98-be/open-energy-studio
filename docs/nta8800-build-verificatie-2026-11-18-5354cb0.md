# NTA 8800 Linux-devbouwbewijs — 18 november 2026

Twee afzonderlijke, handmatig gestarte GitHub Actions-runs, [44310717707](https://github.com/Erika98-be/open-energy-studio/actions/runs/44310717707) en [44321085978](https://github.com/Erika98-be/open-energy-studio/actions/runs/44321085978), bouwden dezelfde broncommit `5354cb0dd29bab13a6fb36b43297f62d3a886f2e` met `scripts/build-nta-fixed-layout.py`. Beide runs slaagden inclusief negen Python-bouwbewijstests, een Linux-debugbouw van desktop, API, MCP en referentiegate, en controle van bronmetadata en artefactbytes. De reguliere [CI op dezelfde commit](https://github.com/Erika98-be/open-energy-studio/actions/runs/44300319371) slaagde met de NTA-gate en desktopbuilds voor Linux, Windows en macOS.

Beide runnerartefacten zijn lokaal gedownload naar `/tmp/nta-build-44310717707` en `/tmp/nta-build-44321085978`. `scripts/verify-nta-build.py --source-repo .` controleerde voor elk manifest de broncommit, lockbestanden en vier artefactbytes. `cmp` bevestigde bytegelijkheid van de twee manifesten; hun SHA-256 is `101b53d0d018fa9ba080e219a16bbade1a4fcba97ad8da82cca51e09e5dd3bcd`. De vijf bestanden hebben in beide downloads dezelfde SHA-256:

| Artefact | Bytes | SHA-256 |
| --- | ---: | --- |
| API | 230581624 | `40bf7fca2d9a036d31f5bcd3df8a3ebf7a72e36621f1c34dca5ab392cffd6795` |
| MCP | 260753152 | `181875f627b182d29b9e06896535cf4c18b56fa178d4231a3bd72a9b831cf2e1` |
| Referentiegate | 224568888 | `d2c96798df53dbc7df27b70d09cd06a7dc9c16bf1dcea2be255bcd93d7311b19` |
| Desktop `.deb` | 89829650 | `e59a8a629d94c3fcf2a749424adb893e0a5e7475ed6f3ec2127415f271f3aa4e` |

Dit toont bytegelijke uitvoer voor deze broncommit en vaste Linux-debugprocedure in twee afzonderlijke GitHub-runs. De runs gebruiken dezelfde GitHub-runnerklasse en bewijzen geen bytegelijkheid op een andere host, voor de reguliere desktopinstallers op Windows/macOS of voor andere toolchains. Het manifest houdt `referenceVerified=false` en `attestStatus=unattested`; onafhankelijke NTA-referentiegevallen en formele externe toets ontbreken.
