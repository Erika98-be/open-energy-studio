# NTA 8800 installerherbouw — 25 november 2026

De [CI-run op broncommit `bb3f594f`](https://github.com/Erika98-be/open-energy-studio/actions/runs/45522044465) is tweemaal op dezelfde commit uitgevoerd. Beide pogingen slaagden met de NTA-gate en Linux-, Windows- en macOS-desktopjobs. De installer-artefacten van beide pogingen zijn afzonderlijk gedownload. Elk van de acht pakketbestanden is met `scripts/verify-nta-installer.mjs` tegen het bijbehorende manifest en de volledige broncommit `bb3f594fd7a840a535410cf6f566fc01fe64a49a` gecontroleerd.

| Pakket | Bytes poging 1 / 2 | SHA-256 poging 1 / 2 | Bytegelijk |
| --- | ---: | --- | --- |
| Linux `.deb` | 9.774.470 / 9.774.470 | `f7232448720af642a17caf50ff23bd6200b1af9ac4c43ad6ef07a6dc29fa3dcf` / gelijk | ja |
| Linux AppImage | 86.862.328 / 86.862.328 | `0bf0b22b2fbfbc2317adf010390af7d2d9527f2337ffb231f5096e80a17f0c53` / gelijk | ja |
| Windows NSIS | 7.670.382 / 7.670.382 | `f10f3cb616e7477803f84a2c9034e2f37997297dbefb5cc230a737b87936e2d7` / gelijk | ja |
| macOS universele DMG | 18.049.615 / 18.049.616 | `52dfa503a29e91c757ecd256d7da8845b438eb71cbf0ee2073db1723a869aace` / `1ec49dbd1faf4280d33c41697db8438b174248ce7874d61d296521a74813f490` | nee |

De Linux- en Windows-manifesten zijn per platform bytegelijk. Alle pogingen gebruikten Rust `1.100.0`; Node was `v22.23.5` op Linux/Windows en `v22.23.2` op macOS. `7z` pakte uit beide DMG's dezelfde vier gewone bestanden uit: gelijke paden en SHA-256. Het negeerde bij beide pakketten de opzettelijke `/Applications`-link als onveilig pad (exitcode 2). De macOS-CI koppelt de DMG daarnaast alleen-lezen en controleert de app voor x86_64 en arm64 en de `/Applications`-link.

Dit is herbouwbewijs binnen dezelfde GitHub-runnerklassen voor deze broncommit. De macOS-pakketbytes zijn nog niet reproduceerbaar aangetoond. De inhoudsvergelijking van de uitgepakte gewone bestanden is geen volledige vergelijking van HFS+-metadata of installatiegedrag. Deze bouwproef toetst geen NTA-rekenuitkomst, onafhankelijke ISSO 54-referentie of attestering.
