# NTA 8800 Linux-devbouwbewijs — 10 november 2026

De handmatig gestarte [GitHub Actions-run 42739078882](https://github.com/Erika98-be/open-energy-studio/actions/runs/42739078882) bouwde commit `aedd07559518f5baf8df5cc4c609dd96fcc496c2` met `scripts/build-nta-fixed-layout.py`. De workflow slaagde, inclusief negen Python-tests voor het bouwbewijs, de Linux-debugbouw van desktop, API, MCP en referentiegate, en controle van bronmetadata en artefactbytes. De runner gebruikte Ubuntu 24.04, Node 24.21.0, npm 12.2.0, Python 3.11 en Rust 1.99.0. De reguliere [NTA-CI op dezelfde commit](https://github.com/Erika98-be/open-energy-studio/actions/runs/42731310435) slaagde met de Linux-, Windows- en macOS-desktopbuilds.

Het runnerartefact `nta-8800-linux-dev-build` omvat volgens GitHub 208446223 bytes en verloopt op 10 december 2026. De vijf bestanden zijn lokaal gedownload naar `/tmp/oes-nta-evidence-42739078882`. Het manifest `oes-nta8800-build_aedd075_linux-amd64.json` heeft op beide hosts SHA-256 `98b1ace59b0b77e56458fcd11c89bfffcebde15100ae85dc10cac5460c4fdda2`. `scripts/verify-nta-build.py --source-repo .` controleerde broncommit, lockbestanden en vier artefactbytes.

Dezelfde commit is onafhankelijk op Linux Mint 22.3 gebouwd vanuit een schone werkboom en de vaste bronlayout, met Node 24.21.0, npm 12.2.0, Rust 1.99.0 en lokaal Python 3.12.3. `scripts/verify-nta-build.py --compare-with` verifieerde beide manifests en alle vier artefacten; `cmp` bevestigde ook bytegelijkheid van de manifests. Een voorafgaande lokale bouw met npm 11.19.0 leverde dezelfde vier artefactbytes, maar een afwijkend manifest door de geregistreerde npm-versie. Voor de hieronder vermelde vergelijking is de lokale bouw met de gepinde npm 12.2.0 gebruikt.

| Artefact | Bytes | SHA-256 op beide hosts |
| --- | ---: | --- |
| API | 229751552 | `9f338802c4b47efa524bd545153c50bf84cd857d66f09886be1d2351f4f55b87` |
| MCP | 259923600 | `c42df705e632f9d977b884d8ed5f061293708c5897832c5e3068864c9a63e1fb` |
| Referentiegate | 223739584 | `c6784034252197dbd63a486d8cd2c710cc06f799531271150e5c3508016db707` |
| Desktop `.deb` | 89192238 | `6d1b3d2db7bae0eabc2328d13664f7132deea38cdf6ca15d3ec294316a58bb9f` |

Dit bewijst bytegelijke uitvoer voor deze specifieke Linux-debugprocedure en broncommit op twee hosts. Het bewijst geen reproduceerbaarheid van andere toolchains of platforms, geen visuele desktopacceptatie en geen normconformiteit. Het manifest houdt `referenceVerified=false` en `attestStatus=unattested`; actuele onafhankelijke NTA-referentiegevallen en externe attestering ontbreken.
