# NTA 8800 Linux-devbouwbewijs — 20 november 2026

Twee afzonderlijke [GitHub Actions-runs 44684815932](https://github.com/Erika98-be/open-energy-studio/actions/runs/44684815932) en [44692317895](https://github.com/Erika98-be/open-energy-studio/actions/runs/44692317895) bouwden broncommit `7c189e6e22635cd601bdaf080c3a480abc646b74` met de vaste Linux-debugprocedure. Beide runs slaagden, inclusief negen Python-bouwbewijstests en de manifestcontrole in de workflow.

De artefacten van beide runs zijn lokaal gedownload. Voor beide manifesten bevestigde `python3 scripts/verify-nta-build.py <manifest> --source-repo .` de broncommit, dependency-locks en artefactbytes. Een afzonderlijke SHA-256-vergelijking bevestigde bytegelijkheid van alle vijf bestanden, inclusief het manifest:

| Bestand | Bytes | SHA-256 in beide runs |
| --- | ---: | --- |
| API | 230752000 | `63298c8b95c826413d0d35ea651fad2211fad14d8fcc2c9ac17bdc1d7cde9ac6` |
| MCP | 260923504 | `07dee5bdc327418b89e6f07265fa7dae9b35cc3bb70a25981ef4c8401df55f1b` |
| Referentiegate | 224739256 | `a267ca6fbb678db2b105039064c905bbaf79d9de14f4fef230fa420922ef57b7` |
| Desktop `.deb` | 89891062 | `ced3a304327aeaf713d0899cca0450a995fd2c6f6382187478e3acdf7cf9e263` |
| Manifest | 1890 | `1962599a6109f715ac6d387433b20700a7a197fd5dea8a7474b441780395c85c` |

Dit is bytegelijkheid voor deze commit en procedure op twee GitHub-runners van dezelfde klasse. Het bewijst geen bytegelijkheid op een andere host of voor reguliere Windows- en macOS-installers. De [reguliere CI op `fdcb4412`](https://github.com/Erika98-be/open-energy-studio/actions/runs/44664062391) bevestigt de NTA-gate en drie desktopbuilds voor de laatste codewijziging; `7c189e6` voegde daarna alleen documentatie toe. De bouwmanifesten vermelden `referenceVerified=false` en `attestStatus=unattested`. Onafhankelijke normreferentiegevallen en formele externe toets ontbreken nog.
