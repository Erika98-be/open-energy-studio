# Release-installercontrole en herbouw op `6ea7d998`

De [CI-run 45419023153](https://github.com/Erika98-be/open-energy-studio/actions/runs/45419023153) slaagde op 24 november 2026: NTA-gate, Linux-, Windows- en macOS-desktopbuild en de nieuwe manifestcontrole vóór upload. De `nta-build-evidence`-job was volgens zijn afzonderlijke branchvoorwaarde overgeslagen.

De drie installer-artefactsets zijn daarna afzonderlijk van GitHub Actions gedownload. De nieuwe `scripts/verify-nta-installer.mjs` is lokaal op elke gedownloade set uitgevoerd met de volledige verwachte broncommit `6ea7d998c7cc57f5d9806f295e118a4e47a2aba4`. Alle paden, byteaantallen en SHA-256-waarden kwamen overeen met hun manifest. De manifesten vermelden `referenceVerified=false` en `attestStatus=unattested`.

| Platform en pakket | Bytes | SHA-256 |
|---|---:|---|
| Linux `.deb` | 9.774.474 | `511ac13ec42cf4f8bc3cb062b74955453ee0dc5fe5d5999e457baff9ad5bf7e0` |
| Linux AppImage | 86.862.328 | `9322d8adf06a36f6ae2c87326850a2036979a349cd20d6c8c616d239aa6e26f9` |
| Windows NSIS | 7.670.382 | `f10f3cb616e7477803f84a2c9034e2f37997297dbefb5cc230a737b87936e2d7` |
| macOS universele DMG | 18.049.605 | `eb3b6b09cfe993159a1344cf9ed7569ba8431e323f492eb21ff0e3bae2d5a55a` |

De lokale vier gerichte Node-tests, `node --check`, `bash -n` en `git diff --check` slaagden vóór deze CI-run. De NTA-gate draaide de nieuwe tests ook in CI; alle drie de desktopjobs voerden de manifestcontrole uit. De Windows-installatieproef en macOS-koppelproef slaagden eveneens.

## Tweede CI-poging

De tweede poging van [dezelfde CI-run](https://github.com/Erika98-be/open-energy-studio/actions/runs/45419023153/attempts/2) slaagde opnieuw met NTA-gate en drie desktopplatforms, inclusief de manifestcontrole vóór upload. Alle drie de artefactsets zijn opnieuw afzonderlijk gedownload en met de lokale manifestlezer tegen dezelfde broncommit nagehasht.

De twee Linux-manifesten zijn bytegelijk en hun `.deb`- en AppImage-pakketten hebben dezelfde grootte en SHA-256 als in de tabel. De twee Windows-manifesten en NSIS-installers zijn eveneens bytegelijk. Dit toont bytegelijke herbouw van deze drie pakketbestanden op de gebruikte CI-runnerklassen voor deze broncommit.

De macOS-manifesten en DMG's verschillen: poging 1 telt 18.049.605 bytes met SHA-256 `eb3b6b09cfe993159a1344cf9ed7569ba8431e323f492eb21ff0e3bae2d5a55a`; poging 2 telt 18.049.612 bytes met SHA-256 `a84aa152e8c8e77603f33e99e1c850fcbaa266650c46665f2d54aee74d288c4d`. `7z` pakte uit beide DMG's vier gewone bestanden uit; hun inhoudshashes zijn gelijk. De app-binary heeft in beide pakketten SHA-256 `8df4a9625cb88c3da6e92d564f64a3687ed130ac4710414275c61dacb26543a9`. `7z` sloeg de absolute `/Applications`-link als gevaarlijk over; de CI-koppelproef controleerde die link in beide pogingen. De volledige DMG is dus niet bytegelijk reproduceerbaar aangetoond.

De manifestclaim bewijst op zichzelf niet dat de pakketten werkelijk uit de genoemde bron zijn gebouwd; de tweede herbouw en de CI-bronkoppeling versterken alleen het technische bouwbewijs. Normatieve juistheid, onafhankelijke ISSO 54-uitkomsten en attestering blijven open.
