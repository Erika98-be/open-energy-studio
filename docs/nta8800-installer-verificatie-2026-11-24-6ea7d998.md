# Release-installercontrole op `6ea7d998`

De [CI-run 45419023153](https://github.com/Erika98-be/open-energy-studio/actions/runs/45419023153) slaagde op 24 november 2026: NTA-gate, Linux-, Windows- en macOS-desktopbuild en de nieuwe manifestcontrole vóór upload. De `nta-build-evidence`-job was volgens zijn afzonderlijke branchvoorwaarde overgeslagen.

De drie installer-artefactsets zijn daarna afzonderlijk van GitHub Actions gedownload. De nieuwe `scripts/verify-nta-installer.mjs` is lokaal op elke gedownloade set uitgevoerd met de volledige verwachte broncommit `6ea7d998c7cc57f5d9806f295e118a4e47a2aba4`. Alle paden, byteaantallen en SHA-256-waarden kwamen overeen met hun manifest. De manifesten vermelden `referenceVerified=false` en `attestStatus=unattested`.

| Platform en pakket | Bytes | SHA-256 |
|---|---:|---|
| Linux `.deb` | 9.774.474 | `511ac13ec42cf4f8bc3cb062b74955453ee0dc5fe5d5999e457baff9ad5bf7e0` |
| Linux AppImage | 86.862.328 | `9322d8adf06a36f6ae2c87326850a2036979a349cd20d6c8c616d239aa6e26f9` |
| Windows NSIS | 7.670.382 | `f10f3cb616e7477803f84a2c9034e2f37997297dbefb5cc230a737b87936e2d7` |
| macOS universele DMG | 18.049.605 | `eb3b6b09cfe993159a1344cf9ed7569ba8431e323f492eb21ff0e3bae2d5a55a` |

De lokale vier gerichte Node-tests, `node --check`, `bash -n` en `git diff --check` slaagden vóór deze CI-run. De NTA-gate draaide de nieuwe tests ook in CI; alle drie de desktopjobs voerden de manifestcontrole uit. De Windows-installatieproef en macOS-koppelproef slaagden eveneens.

Dit is integriteitsbewijs voor de gedownloade pakketbytes van één CI-run, geen bytegelijk herbouwbewijs voor deze commit. Eerdere afzonderlijke runs tonen bytegelijkheid van Linux- en Windows-pakketten op hun eigen commits. Een tweede poging op `6ea7d998` is nodig voor een nieuwe herbouwvergelijking. De technische controle bewijst geen normatieve juistheid, onafhankelijke ISSO 54-uitkomst of attest.
