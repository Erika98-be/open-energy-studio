# Installatie

## Desktop-app

De desktop-app is gebouwd met Tauri 2. Een release levert installatiepakketten voor:
- **Windows**: NSIS-installer (`.exe`);
- **Linux**: `.deb`, `.rpm` en AppImage;
- **macOS**: `.dmg`.

Bij elke release horen een leveringsdocument, `SHA256SUMS` en de handleiding als HTML. Controleer een pakket met `sha256sum -c SHA256SUMS`.

## Zelf bouwen

Vereist:
- Node.js 22;
- Rust 1.77.2 of nieuwer (de API/MCP-service vraagt Rust 1.88);
- Tauri 2;
- op Linux ook `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`.

```bash
git clone https://github.com/Erika98-be/open-energy-studio.git
cd open-energy-studio
npm install
npm run tauri:build        # desktop-installers
npm run build              # webversie (map dist/)
```

## Webversie

De webversie rekent via de lokale HTTP-API (standaard poort 3007). Start die met:

```bash
cargo run --release --manifest-path crates/nta8800-service/Cargo.toml --bin api
```

Zie [[API en MCP]] en de [README](https://github.com/Erika98-be/open-energy-studio/blob/nta8800-kernel/README.md).
