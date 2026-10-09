# Verificatie en testen

Elke wijziging aan de berekening gaat door de gate:

```bash
scripts/verify-nta.sh
```

De gate controleert:
- **Versies:** de kernversie tegen de releasenotes, en de stempel van de handleiding.
- **Rekenkern:**
  - eenheidstests en tests per uitgave;
  - optiedekking: elke variant en elk optioneel veld van de kerninvoer, in elke uitgave;
  - numerieke fuzz: grenswaarden, willekeurige waarden en monotonie;
  - grote projecten.
- **Referentiesuites:**
  - de openbare rapporten A–L, als regressie op de vastgelegde uitkomsten van deze kern; de verschillen met de gepubliceerde waarden zijn per post verklaard;
  - de RVO-voorbeeldwoningen;
  - 260 van de 266 ISSO 54 v2.0-deeltests, als *pending* tot de verwachte uitkomsten beschikbaar zijn.
- **Service, API, MCP en desktopcommando's.**
- **Frontend (Vitest):** de end-to-end werkstroom, formulierdekking, formulierbewaking (formulierstanden door de kern), toegankelijkheid en vertalingen.

De rekenkern wordt ook getest op Rust 1.77.2 (MSRV). Zie [[Testprotocol]].

Details: [hoofdstuk 5 van de handleiding](https://github.com/Erika98-be/open-energy-studio/blob/nta8800-kernel/docs/handleiding-nta8800/05-validatie.md) en [openbare rapporten](https://github.com/Erika98-be/open-energy-studio/blob/nta8800-kernel/docs/nta8800-vergelijking-openbare-rapporten.md).
