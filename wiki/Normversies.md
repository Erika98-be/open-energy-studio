# Normversies

| `normVersion` | Uitgave | Status |
|---|---|---|
| `2025+C1` (standaard) | NTA 8800:2025+C1:2026 | registreerbaar |
| `2024` | NTA 8800:2024 met INT-V1:2024 | oudere uitgave, niet registreerbaar |
| `2023` | NTA 8800:2023 | oudere uitgave, niet registreerbaar |
| `2022` | NTA 8800:2022 | oudere uitgave, niet registreerbaar |
| `2020+A1` | NTA 8800:2020+A1:2020 | oudere uitgave, niet registreerbaar |

- **Kiezen:** je kiest de uitgave op de stap *Project*. Nieuwe projecten krijgen de uitgave uit *Instellingen › Berekening*.
- **Oudere uitgave:**
  - bedoeld voor vergelijking;
  - resultaten krijgen de status `calculated_legacy_edition` en zijn niet registreerbaar;
  - het rapport, de statusbalk en het EP-Online-overzicht melden dit.
- **Uitgavegebonden invoer:** invoer die alleen in een bepaalde uitgave bestaat, verschijnt alleen onder die uitgave. Een route die een uitgave niet kent, wordt geweigerd met `route_not_in_edition`.
- **Schakelpunten:** elke uitgave is een reeks schakelpunten bovenop de nieuwere uitgave. Elk schakelpunt is vastgelegd met een paginaverwijzing.

Details: [Normversies in de handleiding](https://github.com/Erika98-be/open-energy-studio/blob/nta8800-kernel/docs/handleiding-nta8800/10-normversies.md) en [docs/nta8800-normversies.md](https://github.com/Erika98-be/open-energy-studio/blob/nta8800-kernel/docs/nta8800-normversies.md).
