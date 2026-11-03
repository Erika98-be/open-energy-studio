# NTA 8800 Linux-devbouwbewijs — 3 november 2026

De handmatig gestarte [GitHub Actions-run 41559173881](https://github.com/Erika98-be/open-energy-studio/actions/runs/41559173881) bouwde commit `1ece277f4f47e96a2e790a6fdd347cd22dbcfae8` via `scripts/build-nta-fixed-layout.py`. De workflow slaagde. Zij gebruikte Ubuntu 24.04, Node 24.21.0, npm 12.2.0, Python 3.11 en Rust 1.99.0. De Python-tests voor de manifestcode, de bouw van het Linux-debugpakket en de API-, MCP- en referentiegate-binaries, en `verify-nta-build.py --source-repo .` slaagden in dezelfde run.

Het manifest heet `oes-nta8800-build_1ece277_linux-amd64.json` en heeft volgens de runlog SHA-256 `beb26879c4d19530a0d9e0e8446dcc350d404ddd3b514155c6897ed40d92a41e`. Het workflow-artefact `nta-8800-linux-dev-build` omvat volgens GitHub 208433771 bytes en verloopt op 3 december 2026. De artefacten zijn niet op een tweede host opnieuw gebouwd en byte voor byte vergeleken; de manifesthash is niet buiten de CI-run onafhankelijk vastgesteld.

Dit is technisch bouw- en bronmetadatabewijs. De ontbrekende officiële referentiegevallen, visuele desktopacceptatie en externe attestering blijven open. Een geslaagde bouw geeft geen NTA-conformiteit vrij.
