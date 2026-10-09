# Vergelijking met openbare BENG-rapporten — 5 oktober 2026

Dit is **geen officiële referentietoets**. Twaalf openbaar gepubliceerde BENG-rapporten (gevallen A–L) zijn in de app nagebouwd en met de rekenkern doorgerekend. Die rapporten zijn gemaakt met geattesteerde software (Uniec) onder oudere NTA 8800-edities. Verschillen zijn daarom deels verwacht. De officiële toetsing voor BRL 9501 loopt via ISSO-publicatie 54 versie 5.0:2026, die niet openbaar is.

De herbouwde invoer staat als fictieve, geanonimiseerde fixtures in `training-data/nta8800-public-comparison-{a,b,c,d,f}.json`. Adressen en namen zijn verwijderd. De test `crates/nta8800-core/tests/public_comparison.rs` legt de huidige uitkomsten vast als regressie; de gepubliceerde waarden zijn alleen context.

## Bronnen

| Geval | Bron | Software, rekendatum en NTA-editie |
|---|---|---|
| A | [openbaar rapport A (vrijstaande woning, plat dak)](https://www.starlinehome.nl/uploads/20210923-Beng_berekening_21.164_002.pdf) | Uniec 3.0.16, 13-04-2021, NTA 8800:2020+A1 |
| B | [openbaar rapport B (rijwoning)](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2024/til-2024-415/1/bijlage/26.2220837_-_Rap._BENG-berekening.pdf) | Uniec 3.1.6.2, 22-03-2023, NTA 8800:2022 |
| C | [openbaar rapport C (vrijstaande woning, twee zones)](https://www.oud-osdorp.nl/wp-content/uploads/2024/03/Rap.-BENG-berekening-V1.0_18-03-2024.pdf) | Uniec 3.2.7.0, 18-03-2024, NTA 8800:2023 |
| D | [openbaar rapport D (vrijstaande vakantiewoning met kap)](https://www.planviewer.nl/imro/files/NL.IMRO.1640.OV22HoHouterhof8-VG01/b_NL.IMRO.1640.OV22HoHouterhof8-VG01_bd1.pdf) | Uniec 3.0.10.0, 30-03-2021, NTA 8800:2020+A1 |
| F | [openbaar rapport F (vrijstaande woning met kap en plat dak)](https://www.planviewer.nl/imro/files/NL.IMRO.1640.OV22KoKelperveen24-VG01/b_NL.IMRO.1640.OV22KoKelperveen24-VG01_bd10.pdf) | Uniec 3.0.19.4, 08-03-2022, NTA 8800:2020+A1 (zie [F in 2020+A1](#f-in-2020a1-7-oktober-2026)) |
| G | [openbaar rapport G (vrijstaande woning met kelder)](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2025/til-2025-25471/1/bijlage/BENG_woning_B.pdf) | Uniec 3.3.5.0, 29-04-2025, NTA 8800:2024 (zie [G en H](#g-in-2024-en-h-het-eerste-utiliteitsgebouw-in-2023-9-oktober-2026)) |
| H | [openbaar rapport H (utiliteitsgebouw met sportschool)](https://heusden.bestuurlijkeinformatie.nl/Document/View/3256b603-e6fb-4fa0-ab2c-b63fa0af6d28) | Uniec 3.2.9.2, 29-05-2024, NTA 8800:2023 (zie [G en H](#g-in-2024-en-h-het-eerste-utiliteitsgebouw-in-2023-9-oktober-2026)) |

De rapporten noemen de editie niet zelf. De editie volgt uit de rekendatum en de aanwijzingsperiode (`NormVersion::designation_period`): 2020+A1 tot 1 juni 2022, 2022 tot 1 juli 2023, 2023 tot 1 juli 2024, 2024 tot 29 mei 2026. De Uniec-versie past daarbij (3.0 voor 2020+A1, 3.1 voor 2022, 3.2 voor 2023).

Andere gevonden rapporten zijn niet nagebouwd (zie [Gezochte rapporten](#gezochte-rapporten-7-oktober-2026)).

## Uitkomsten

BENG 1 en 2 in kWh/(m²·jr), BENG 3 in %.

| Geval | Gepubliceerd | Kern, eerste herbouw (forfaitaire WP) | Kern met kwaliteitsverklaring en 6.2b | Kern na regel-voor-regel-reconciliatie |
|---|---|---|---|---|
| A | 92,99 / 25,19 / 80,4 | 94,00 / 75,59 / 53,8 | 94,00 / 33,84 / 76,0 | 94,00 / 35,15 / 74,9 |
| B | 54,61 / 27,10 / 64,8 | 52,96 / 38,04 / 51,5 | 52,96 / 24,10 / 67,3 | 52,96 / 28,84 / 62,6 |
| C, twee zones | 64,47 / 28,70 / 70,9 | BENG 1 niet berekenbaar / 31,44 / 69,1 | 64,70 / 31,44 / 69,1 | 64,70 / 31,54 / 69,0 |

De laatste kolom was wat `tests/public_comparison.rs` vastlegde tot 9 oktober 2026. Sindsdien rekent A met de gedeclareerde f_ctrl 0,50 uit het rapport (zie [Gedeclareerde f_ctrl en zonwering per raam](#gedeclareerde-f_ctrl-en-zonwering-per-raam-9-oktober-2026)): 94,00 / 34,37 / 74,9. Daarin zijn de invoercorrecties uit de reconciliatie verwerkt (zie hieronder) en rekent een gedeclareerd warmtepomprendement met f_prac 0,95. A_g, A_ls en de PV-opbrengst komen in alle drie gevallen exact overeen. TOjuli is overal 0.

## Wat er is aangepast

1. **Kwaliteitsverklaring warmtepomp (§9.1, p. 285; §13.8.4.7.2, p. 640).** De rapporten A en B gebruikten productwaarden uit een BCRG-verklaring: COP 4,35 / 1,30 (A) en 4,05 / 1,55 (B). De kern kon die niet opnemen in de projectberekening, waardoor de forfaitaire tabel 9.27 gold.
   - Nu kan bij de forfaitaire warmtepomp een `qualityDeclaration` worden ingevuld, met:
     - het nummer van de verklaring;
     - de COP;
     - de energiefractie;
     - de jaarlijkse hulpenergie.
   - Bij tapwater kan een gedeclareerd rendement worden ingevuld.
   - Beide hebben een eigen sectie in het NTA-formulier.
   - De COP wordt naar beneden afgerond op 0,05, zoals §9.1 voorschrijft.
2. **Eén woning in meerdere rekenzones (6.2b, p. 160; 7.21–7.24, p. 177).** Elke zone telde eerst een hele woning, zodat de bewoners dubbel meetelden. De W/m²-omweg blokkeerde BENG 1.
   - Nu krijgt elke zone N_woon;zi = A_g;zi / Σ A_g;zi × N_woon.
   - BENG 1 is weer berekenbaar: 64,70, tegen 64,47 gepubliceerd.
3. **Koudeafgifteverlies (10.15).** Er is een zachtere melding bijgekomen, `cooling_emission_loss_exceeds_need`, voor maanden waarin het verlies groter is dan de behoefte. Dat speelt in geval A, met een factor 1,56. De harde melding boven 3× blijft.
4. **Hulpenergie koeling (geval C, circa 97 kWh tegen 10 kWh).** Dit is nagelopen en is geen fout. Bijna alles is de regelenergie van formule 10.87 (p. 425): 0,010 kW die altijd in bedrijf is, samen 87,6 kWh per jaar. De pompenergie zelf is klein. Het staat nu in de interpretatielijst.

## Regel-voor-regel-reconciliatie

Per post is het elektriciteitsgebruik uit het rapport naast de kern gelegd. Tussen haakjes staat de geleverde warmte of koude. Het effect op BENG 2 is Δ × 1,45 / A_g. De optelsom van de posten verklaart het verschil in BENG 2 tot op ±0,03 kWh/(m²·jr), de afronding van de hele kWh in de rapporten.

Elektriciteit in kWh/jr, rapport → kern, vóór de correcties in deze versie:

| Post | A | B | C |
|---|---|---|---|
| Warmtepomp verwarming (warmte) | 1 269 → 1 243 (5 242 → 5 407) | 1 186 → 1 057 (4 564 → 4 282) | 4 541 → 4 574 (15 212 → 15 323) |
| Hulpenergie verwarming | 53 → 52 | 171 → 135 | 329 → 331 |
| Tapwater (warmte) | 1 673 → 1 590 (2 067 = 2 067) | 2 136 → 2 029 (3 145 = 3 145) | 3 359 → 3 598 (4 703 → 5 037) |
| Ventilatoren incl. vorstbeveiliging | 12 → 91 | 360 → 129 | 354 → 354 |
| Koeling (opgewekte koude) | 745 → 1 174 (2 236 → 3 522) | 312 → 446 (936 → 1 339) | 539 → 663 (1 618 → 1 989) |
| Hulpenergie koeling | 10 → 98 | 10 → 98 | 10 → 97 |
| PV | 2 437 → 2 467 | 1 646 = 1 646 | 4 065 = 4 065 |

Bijdrage per oorzaak aan het verschil kern − rapport, in BENG 2 kWh/(m²·jr) / BENG 3 %-punt. De bijdragen zijn stap voor stap bepaald; de verdeling over BENG 3 hangt licht af van de volgorde.

| Oorzaak | Soort | A | B | C | In deze versie |
|---|---|---|---|---|---|
| Lezing van de rapportinvoer (ventilatoren, leidingen, hulpenergie) | invoer | +1,52 / −0,8 | −3,00 / +2,7 | −0,10 / +0,1 | gecorrigeerd in de fixtures |
| f_prac 0,95 bij een gedeclareerd WP-rendement | modellering | −2,82 / +1,8 | −1,73 / +2,0 | – | kern aangepast (zie onder) |
| Regelenergie koeling 10.87 (87,6 kWh/jr) | interpretatie | +1,66 / −0,9 | +0,94 / −0,8 | +0,50 / −0,3 | blijft, vraag aan NEN |
| Koudeafgifteverlies 10.15 | interpretatie | +8,55 / −5,0 | +1,83 / −1,6 | +1,46 / −1,0 | blijft, vraag aan NEN |
| PV: afronding K_pk (editie 2020, formule 16.4) | versie | −0,57 / +0,4 | – | – | versieverschil |
| Tapwater: kolom binnendiameter in tabel 13.2 (editie 2023) | versie | – | – | +1,35 / −0,9 | verdwijnt in de editie 2023 (zie onder) |
| Rest (warmte- en koudebehoefte) | onverklaard | +0,30 / 0,0 | −1,04 / +0,2 | −0,47 / +0,4 | open |
| **Totaal** | | **+8,65 / −4,4** | **−3,00 / +2,5** | **+2,74 / −1,8** | |

Na de twee correcties (invoer en f_prac) blijft over, in BENG 2 kWh/(m²·jr): A +9,96 (35,15 tegen 25,19; met de gedeclareerde f_ctrl van 9 oktober +9,18, de post "rest" daalt met 0,78), B +1,74 (28,84 tegen 27,10), C +2,84 (31,54 tegen 28,70). Dat is precies de som van 10.87, 10.15, de versieverschillen en de rest.

### Toelichting per oorzaak

1. **Invoer.**
   - A: het rapport geeft de ventilator als productwaarde, P 8,5 W en f 0,147. Met 11.132 (p. 512, f_prac;vent 0,9) geeft dat 12,2 kWh, gelijk aan het rapport. De eerste herbouw rekende forfaitair (91 kWh).
   - B: vier units van 21,7 W met f 0,364 geven 307,5 kWh, plus 52,6 kWh vorstbeveiliging: 360,1 kWh, gelijk aan het rapport. Ook de gedeclareerde hulpenergie van de warmtepomp van 146 kWh ontbrak.
   - Alle drie: volgens de rapporten liggen er geen leidingen buiten de verwarmde of gekoelde zone. De herbouw nam de standaard van 15 % aan.
   - Gevoeligheid: de thermische massa is bepalend voor BENG 1. A als zwaar geeft 76,0 in plaats van 94,0; B als licht geeft 63,9 in plaats van 53,0. Een kozijnfractie van 0,15 geeft A 98,8 en B 53,2.
2. **f_prac bij een kwaliteitsverklaring.** In A en B is de elektriciteit van het rapport tot op de kWh gelijk aan warmte / (COP × 0,95). Formule 9.62 (tabelroute, p. 337) heeft f_prac 1; 9.63 (gegevens volgens bijlage Q, p. 340) heeft 0,95. Een kwaliteitsverklaring voor verwarming is opgesteld volgens bijlage Q (p. 615), dus de kern rekent een gedeclareerde COP nu met 0,95. Voor tapwater geeft 13.152 (p. 616–617) f_prac 1,0 alleen aan de forfaitaire waarden van 13.8.4.5–13.8.4.7; een gedeclareerde waarde valt onder "alle overige gevallen", 0,95. Beide stonden in de vorige versie op 1,0.
3. **10.87.** De tekst is in 2020 (p. 403) en 2025 (p. 425) gelijk: 0,010 kW regelenergie die altijd in bedrijf is. De rapporten tellen alleen pompenergie (circa 10 kWh).
4. **10.15.** De formule is sinds 2020 ongewijzigd (2020 p. 353, 2025 p. 376). De tabellen voor Δθ zijn in 2024 vervangen (−4,0/−4,0/−3,3 K oud, −3,55/−3,55/−3,05 K nieuw), wat de letterlijke uitkomst minder dan 0,5 % verandert. Letterlijk toegepast is het verlies 80–83 % van de behoefte, en meer dan 100 % in mei en september, omdat θ_int,inc dicht bij θ_e,comb ligt. Bij onze behoefte impliceren de rapporten 16 % (A), 21 % (B) en 42 % (C). 10.15 neemt het maximum van de verhouding en 0,15 en geldt alleen als θ_int,inc − θ_e,comb negatief is. Rekenen met de verhouding begrensd op 0,15 reproduceert A en B binnen 40–50 kWh koude; C houdt 309 kWh over. Welke regel de andere software toepast, is uit de rapporten niet vast te stellen.
5. **Versieverschillen.**
   - PV (A): de editie 2020 rondt K_pk in 16.4 (p. 651) af naar beneden op een veelvoud van 5 W/m²; 2025 voegt 16.4b toe (p. 679, Wp per paneel). Met een aangenomen paneel van 1,646 m² en 195 W/m² geeft dat factor 0,98784, en 2 437 tegen 2 467 kWh.
   - Tapwater (C): de editie 2023 (p. 533) had η_k = 0,55 voor een binnendiameter tot 10 mm; 2025 (p. 543) geeft alleen 0,43. Met de oude waarde wordt de tapwaterwarmte 4 703,1 kWh, gelijk aan het rapport.
   - CO₂ (geen BENG): 0,34 in tabel 5.2 van 2023 tegen 0,268 in 2025. Met 0,34 komen de 451, 860 en 1 723 kg uit de rapporten exact terug.
6. **Rest.** Netto warmtebehoefte rapport → kern: A 59,10 → 61,39 (+3,9 %), B 29,48 → 27,79 (−5,7 %), C 51,62 → 52,33. Dit is bouwfysica en invoerdetail (belemmering, thermische massa); in C ook het resterende verschil in koudebehoefte.

### B en C in de editie 2023

C is berekend volgens NTA 8800:2023; B valt in de periode van 2022 (zie [A, B en D in hun eigen editie](#a-b-en-d-in-hun-eigen-editie-7-oktober-2026)). 2022 verschilt voor B niet van 2023. De kern rekent 2023 nu ook (`normVersion: "2023"`, zie [nta8800-normversies.md](nta8800-normversies.md)). Uitkomsten BENG 1 / BENG 2 / BENG 3:

| Geval | Rapport | Kern 2024 | Kern 2023 |
|---|---|---|---|
| B | 54,61 / 27,10 / 64,8 | 52,96 / 28,84 / 62,6 | 52,96 / 29,10 / 62,5 |
| C (keukenleiding ≤ 10 mm) | 64,47 / 28,70 / 70,9 | 64,70 / 31,54 / 69,0 | 64,70 / 30,44 / 69,8 |

- C: met `kitchenPipeDiameter: "up_to_10_mm"` geeft tabel 13.2 (2023 p. 533) η_W;em;k 0,55 in plaats van 0,43. BENG 2 daalt precies 1,35 en BENG 3 stijgt 0,9: de versiepost van de tabel hierboven verdwijnt. Wat overblijft (+1,49 BENG 2) is 10.87 (+0,50), 10.15 (+1,46) en de rest (−0,47).
- B: de schakelpunten van 2023 verhogen BENG 2 met 0,26; BENG 1 blijft gelijk. Opgebouwd uit:
  - **+0,11: ΔT_C;fan** (11.3.2.7). Voor de koudebehoefte van woningen geldt 0,7 K in 2023 (p. 496) tegen 0,4 K in 2024 (p. 491). B heeft een WTW-unit met volledige bypass, dus de uitzondering "WTW zonder bypass: 0 K" geldt niet. De warmere toevoerlucht verhoogt de koudebehoefte van de werkelijke ventilatie en daarmee de koeling in BENG 2. BENG 1 rekent met het vaste systeem C1 zonder ventilatoren in de toevoer en verandert niet. Nagegaan door elk schakelpunt afzonderlijk op de 2024-waarde te zetten: alleen de koelwaarde van ΔT_fan geeft het verschil (de verwarmingswaarde is voor B 0 K in beide uitgaven, omdat het WTW-rendement de dissipatie bevat). De waarden zijn juist overgenomen.
  - **+0,13: afgifte verwarming** volgens tabel 9.4 van 2023 (vloerverwarming, onbekende isolatie → (9.18a), Δθctr,1 2,5, eenpijpskolom 0,7, Δθroomaut −0,5, Δθim −0,2: 3,2 K tegen 2,5 K in 2024).
  - **+0,02: afgifte koeling** volgens tabellen 10.2–10.5 (vloerkoeling: −4,0 K tegen −3,55 K).
- C: −1,35 door tabel 13.2 (≤ 10 mm), +0,24 afgifte verwarming en +0,02 afgifte koeling; ΔT_C;fan heeft voor C geen effect. Uitkomst 30,44 (was 30,19 vóór de afgifteschakelpunten).
- B heeft geen gegevens over de binnendiameter, dus tabel 13.2 blijft op "overig". Het verschil met het rapport blijft verklaard door 10.87, 10.15 en de rest.
- De afgifteroutes van 2023 (tabellen 9.2–9.10 en 10.2–10.5) zijn nu omgeschakeld. Omdat de rapporten de 2023-afgiftegegevens niet tonen, rekent de kern met de onbekende waarden van 2023; dat verhoogt BENG 2 en vergroot het verschil met de rapporten iets. Met de werkelijke afgiftegegevens (`emission.edition2023`) kan dat dalen.

De test staat in `crates/nta8800-core/tests/public_comparison.rs` (`cases_b_and_c_under_nta_8800_2023`).

De vragen over 10.15 en 10.87 staan in [nta8800-vragen-nen.md](nta8800-vragen-nen.md).

## A, B en D in hun eigen editie (7 oktober 2026)

Sinds de kern NTA 8800:2022 en 2020+A1 rekent, lopen A en D in 2020+A1 en B in 2022. De test is `cases_a_and_b_under_their_own_editions` en `case_d_under_nta_8800_2020_a1` in `crates/nta8800-core/tests/public_comparison.rs`. BENG 1 / BENG 2 / BENG 3:

| Geval | Rapport | Kern 2024 | Kern in de eigen editie |
|---|---|---|---|
| A (2020+A1) | 92,99 / 25,19 / 80,4 | 94,00 / 34,37 / 74,9 | 94,00 / 35,29 / 74,4 |
| B (2022) | 54,61 / 27,10 / 64,8 | 52,96 / 28,84 / 62,6 | 52,96 / 29,10 / 62,5 |
| D (2020+A1) | 86,72 / 39,19 / 83,5 | – | 86,35 / 39,07 / 83,6 |
| E (2022) | 86,82 / 28,89 / 74,1 | – | 88,61 / 31,68 / 72,6 |

**Invoer die de oudere edities anders vragen.**
- (8.47): 2022 en 2020+A1 rekenen met de werkelijke hoogte h van de vloer boven maaiveld (2022 p. 236). A en B geven 0,10 m. Dat verandert BENG 1 niet op twee decimalen.
- 2020+A1 kent geen werkelijke leidinglengte bij woningen (punt 77). De 48,84 m van A is de forfaitaire lengte die Uniec bij "leidinggegevens onbekend" toont; 9.36 geeft dezelfde lengte (BENG 2 35,15 → 35,14 in 2024).
- 2020+A1 rondt K_pk af naar beneden op 5 W/m² (punt 68). A: 325 Wp op 9 panelen van samen 15,21 m² is 192,3 → 190 W/m²; de kern geeft dan de 2 437 kWh van het rapport. In 2024 telde de kern 2 467 kWh.

**A in 2020+A1.** Beide met de gedeclareerde f_ctrl 0,50 van het rapport (9 oktober 2026; daarvoor 35,15 en 36,06). BENG 2 stijgt van 34,37 naar 35,29: +0,56 door de PV-afronding (de versiepost van de tabel hierboven verdwijnt) en +0,36 door de schakelpunten van 2023 (afgifte verwarming en koeling, ΔT_C;fan), die ook in 2022 en 2020+A1 gelden. De overige punten van 2020+A1 raken A niet: de warmtepomp heeft een gedeclareerde hulpenergie, dus punt 74 speelt niet. Wat tegen het rapport overblijft, is 10.15 (+8,55), 10.87 (+1,66) en de rest.

**B in 2022.** Gelijk aan 2023 (29,10): geen van de punten 49–67 raakt B. De luchtwarmtepomp levert 45 °C, onder de grens van 55 °C van punt 49.

**D in 2020+A1.** Een vrijstaande vakantiewoning ("andere logiesfunctie", woningbouw volgens tabel 6.1) van 79,70 m² met één rekenzone. Het rapport is een volledige Uniec-uitdraai. Herbouw:
- Gevels W en O 47,33 m² bruto, N en Z 23,75 m² (Rc 4,70); twee dakvlakken van 47,48 m² onder 30° (Rc 6,30); vloer op grond 82,23 m² (Rc 3,70), omtrek 40,09 m (de funderingslengtes). Ramen U 1,4 / g 0,60, deur U 1,6. Lineaire bruggen per vlak zoals opgegeven.
- Massa: "dragend metselwerk met massieve betonnen vloeren", tabel 7.10 rij > 750 kg/m² (`massKgPerM2` 800).
- Infiltratie forfaitair: de kern geeft 1,4 × 0,7 × 1,0 = 0,98 dm³/(s·m²), gelijk aan q_v10;lea;ref van het rapport.
- Grondwaterwarmtepomp "voldoet aan tabel 9.28", 35 °C, COP 5,00: de rij van tabel 9.28 met c_bron 1. Het rapport geeft geen meetwaarden; de fixture zet ze net boven het minimum van tabel 9.28.
- Vloerverwarming in een vertrek van 4–6 m (afgifteroute voor hoge ruimten, 5,0 m), regeling in het hoofdvertrek.
- Ventilatie C.2c met forfaitaire ventilatoren, geïnstalleerde capaciteit 117 dm³/s.
- Elektrische boiler van 200 l, label C, met geïsoleerde warme aansluiting: f_sto;dis;ls 1,5 (2020 p. 545, punt 64).
- 17 PV-panelen van 350 Wp, west, 30°. Het paneeloppervlak staat niet in het rapport; de fixture neemt 1,75 m² (200 W/m²), zodat de afronding van punt 68 niets afhaalt.

Per post, elektriciteit in kWh/jr (het rapport geeft primaire energie; gedeeld door 1,45):

| Post | Rapport | Kern | Verschil in BENG 2 |
|---|---|---|---|
| Warmtepomp verwarming (warmte) | 2 427 (12 136) | 2 421 (12 103) | −0,12 |
| Hulpenergie verwarming | 46 | 46 | 0,00 |
| Tapwater | 3 552 | 3 552 | 0 |
| Ventilatoren | 401 | 401 | 0 |
| PV (op de meter) | 4 273 | 4 273 | 0 |
| **BENG 2** | **39,19** | **39,07** | **−0,12** |

- **Hulpenergie.** Het rapport rekent 9.85 met A = 13,0 kWh (toestel vanaf 2015): 13,0 + 0,132 × 2 427 / (0,4 × 24) = 46,4. De fixture geeft de warmtepomp het installatiejaar 2021 (`installationYear`); de kern neemt dan ook A = 13,0 en rekent 46 kWh op zijn eigen 2 421 kWh. Zonder installatiejaar zou de kern A = 87,6 nemen (vóór 2015 of onbekend, punt 74 in [nta8800-normversies.md](nta8800-normversies.md)): 119 kWh en BENG 2 38,42. Wat tegen het rapport overblijft, is 6 kWh warmtepompelektriciteit (hieronder).
- **Ventilatoren.** Tabel 11.23 geeft voor ventilatoren vanaf 2007 0,45 W/(m³/h). Met dat fabricagejaar (nieuwbouw 2021) is de uitkomst gelijk aan het rapport. Een eerste herbouw met een onbekend fabricagejaar nam de oudste rij (4,00 W/(m³/h) voor wisselstroom) en gaf 3 567 kWh; dat was een invoerfout in de herbouw, geen fout in de kern.
- **Warmte en BENG 1.** Het rapport geeft het glas op de oostgevel (9,84 m²: vier ramen en de glazen deur) een constante overstek, maar niet de maat. Sinds de kern een belemmering per raam kent (`windowObstructions`), staat die overstek alleen op die ramen. De klassen van tabel 17.8/17.9 geven (BENG 1 / BENG 2 / TOjuli):

  | h_o;⊥ | BENG 1 | BENG 2 | TOjuli |
  |---|---|---|---|
  | minimale belemmering (vóór 7 oktober) | 82,49 | 37,06 | 0,67 |
  | ≤ 0,4 | 86,35 | 39,07 | 0,27 |
  | 0,5–0,75 | 85,56 | 38,65 | 0,43 |
  | ≥ 1,0 | 84,78 | 38,01 | 0,67 |

  Alleen de klasse h_o;⊥ ≤ 0,4 geeft de TOjuli van het rapport (0,29) en vrijwel zijn BENG 1. De fixture neemt h_o;⊥ 0,25 en vermeldt dat als aanname. BENG 1 ligt dan 0,4 % onder het rapport, BENG 2 0,12.
- **Tabel 9.28.** De kern eiste voor de rij van tabel 9.28 een beproeving volgens NEN-EN 14511-2:2022. Dat is de gedateerde verwijzing van 2023 (p. 322). 2022 (p. 14, 316) en 2020+A1 (p. 15, 314) verwijzen naar NEN-EN 14511-2:2007. De kern volgt nu de verwijzing van de editie (`heat_pump_high_test_standard`).

D in 2022 (alleen ter vergelijking; D valt in de periode van 2020+A1): 86,35 / 41,79 / 82,6. Het verschil met 2020+A1 is de hulpenergie van de warmtepomp: 2022 rekent een warmtepomp met de eigen constanten van 9.85 (A 43,8, punt 74), 2020+A1 met A 13,0 voor een toestel vanaf 2015.

**E in 2022.** Een vrijstaande woning van 209,40 m² met één rekenzone (Uniec 3.1.5.0, 31-01-2023, [rapport](https://www.boekel.nl/data/downloadables/2/2/1/8/7564003_1675349122509_20230131-bb_beng_mpg-22-323.pdf)). Gepubliceerd 86,82 / 28,89 / 74,1 en TOjuli 0 (actieve koeling). De kern: 88,61 / 31,68 / 72,6. De test is `case_e_under_nta_8800_2022`. Herbouw:
- Vier gevels met elk hun constructies (spouwmuur Rc 5,99, betimmering 5,19, zijwang dakkapel 4,70), vier dakvlakken onder 50° (Rc 6,30) met dakramen, vloer op grond 139,08 m² (Rc 3,98), omtrek 65,53 m. De bruto gevelvlakken sluiten op de ramen (58,52 / 50,75 / 51,73 / 60,29 m²).
- Geen lineaire bruggen in de uitdraai: de forfaitaire toeslag ΔU_for van 8.2/8.3. Zonder die toeslag gaf de herbouw 72,67 voor BENG 1.
- Belemmering per raam (`windowObstructions`): zijbelemmering op D en L (voorgevel) en op I en H (noordgevel), volledige belemmering op F (13,19 m² oost) en G. De uitdraai geeft per zijbelemmering de hoogte, de afstand en de breedte, in een blok dat bij tekstextractie wegvalt maar in de opgemaakte pagina staat. Met b_b = afstand / breedte (2022 p. 673): D 3,31 / 1,10 = 3,01, L 2,33 / 1,75 = 1,33, I 4,61 / 12,85 = 0,36 en H 1,49 / 12,85 = 0,12, alle lager dan 2,5 m. Een eerdere versie van de fixture nam b_b 0,5 voor alle vier (88,77 / 31,73 / 72,6). Voor de volledige belemmering neemt de fixture aan dat de koelvoorwaarden niet vaststaan (tabel 17.5); met de voorwaarden vervuld daalt BENG 1 met 1,10 en BENG 2 met 0,83.
- Lucht/waterwarmtepomp 9 kW met productspecifiek COP 4,15, energiefractie 0,992 en 281 kWh hulpenergie; aanvullende distributiepomp 164 W (EEI 0,23); 20,10 m geïsoleerde leiding buiten de verwarmde zone.
- Twee tapwatersystemen, verdeeld met 13.19a: de warmtepomp (productspecifiek 1,60) op de badruimte, een kokendwaterkraan met een vat van 7 l (H 0,12 W/K) op het aanrecht. Het rapport geeft 2 962 en 625 kWh behoefte.
- Ventilatie D.2 met wtw 0,893, volledige bypass met koudeterugwinning, ventilatoren 170,8 W met f 0,364; infiltratie gemeten 0,63.
- Compressiekoeling forfaitair met vloerkoeling en 134,02 m leiding.
- 10 panelen van 405 Wp, zuid, 50°; paneeloppervlak aangenomen (200 W/m²).

Per post, elektriciteit in kWh/jr:

| Post | Rapport | Kern |
|---|---|---|
| Verwarming | 3 915 | 4 010 |
| Hulpenergie verwarming | 341 | 342 |
| Tapwater | 2 574 | 2 608 |
| Koeling | 186 | 372 |
| Hulpenergie koeling | 8 | 95 |
| Ventilatoren | 690 | 690 |
| PV (op de meter) | 3 543 | 3 543 |

- Ventilatoren, PV en de hulpenergie van de verwarming zijn gelijk aan het rapport.
- Koeling: de letterlijke lezing van 10.15 (zie de gevallen A–C) verdubbelt hier de koude-elektriciteit. Ook de hulpenergie van de koeling ligt hoger.
- Verwarming en BENG 1 (+2,1 %): de aanname voor de volledige belemmering en de forfaitaire toeslag, waarvan het rapport de uitkomst niet toont.

### Gezochte rapporten (7 oktober 2026)

Gezocht is op openbare BENG-rapporten bij vergunningen (repository.officiele-overheidspublicaties.nl, planviewer.nl, gemeentesites) met rekendata in de periodes van 2020+A1 en 2022. Gevonden en niet nagebouwd (het rapport van Boekel is sindsdien geval E, dat van Kelperveen geval F):

| Rapport | Periode | Waarom niet |
|---|---|---|
| [vrijstaande woning 291 m², Vabi EPA, 1-8-2022](https://repository.officiele-overheidspublicaties.nl/externebijlagen/exb-2022-66238/1/bijlage/exb-2022-66238.pdf) | 2022 (rapportdatum) | ander programma en geen rekendatum in de uitdraai; editie niet vast te stellen |
| [woongebouw met 28 appartementen, Uniec 3.1.3.1, 12-07-2022](https://www.schagen.nl/sites/default/files/2022-12/05%20Beng%20berekening.pdf) | 2022 | meerdere zones en woningen; herbouw uit de uitdraai vraagt veel aannames |
| [woning, Uniec 3.2.4.1, 24-11-2023](https://www.boekel.nl/data/downloadables/5/7/7/3/8290459_1703078780501_2248-og10-beng-berekening-geanonimiseerd.pdf), [appartementen, Uniec 3.2.3.0, 9-11-2023](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2024/til-2024-31972/1/bijlage/06._2022288.beng.wd.b0.pdf), [woning, 23-2-2024](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2024/til-2024-13030/1/bijlage/23-73_BENG-berekening_28.pdf) | 2023 | niet in een van de gezochte edities |

## Conclusie

Geen van de verschillen wijst op een formulefout in de rekenformules van de kern. Eén editieregel is rechtgezet: de beproevingsnorm bij tabel 9.28 in 2022 en 2020+A1. Na correctie van de invoer en f_prac zijn de resterende verschillen herleid tot twee bewuste letterlijke lezingen van de norm (10.15 en 10.87), drie versieverschillen tussen de edities en een klein bouwfysisch restant. De gebruikte standaardwaarden per geval staan als bronvermelding (`sourceReference`) in de fixtures.

## F in 2020+A1 (7 oktober 2026)

Een vrijstaande woning van 231,61 m² met twee bouwlagen, een kap met dakkapellen en een plat dak, berekend op 08-03-2022 met Uniec 3.0.19.4. De rekendatum valt in de periode van 2020+A1. De fixture is `training-data/nta8800-public-comparison-f.json`, de test `case_f_under_nta_8800_2020_a1`.

| | BENG 1 | BENG 2 | BENG 3 |
|---|---|---|---|
| Rapport | 74,69 | 2,59 | 97,5 |
| Kern in 2020+A1 | 74,06 | 3,79 | 96,3 |
| Kern zonder belemmering per raam (eerste herbouw) | 73,49 | 3,68 | 96,4 |

**Herbouw.**
- Gevels NO en ZW 65,92 m² bruto, ZO en NW 47,17 m² (Rc 4,70); hellende daken NO en ZW 56,29 m² onder 35°, plat dak 63,80 m² en plat dak van de dakkapel 4,25 m² (Rc 6,30); dakkapelgevels en -wangen; vloer op grond 155,89 m² (Rc 3,70), z ≤ 0,3, h 0,00 m, omtrek 61,72 m (de funderingslengtes 01 en 02). Ramen U 1,4 / g 0,60, deuren U 1,6 / g 0. Alle lineaire bruggen per vlak zoals opgegeven. De opgetelde verliesoppervlakte is 567,70 m²; het rapport noemt 520,93 m² (compactheid 2,25). Dat verschil is niet te herleiden uit de uitdraai, maar A_ls telt alleen in de eis, niet in de indicatoren.
- Massa: "hsb, sfb of staalskeletbouw met staalbeton of niet-massieve betonnen vloeren", tabel 7.10 rij 250 tot 500 kg/m² (2020 p. 180), D_m 180 kJ/(m²·K) zonder plafond.
- Infiltratie: meetwaarde q_v10 0,40 dm³/(s·m²) per gebouw, gebouwhoogte 7,03 m.
- Zonwering: witte buitenrolluiken op alle ramen (tabel 7.5), handbediend (tabel 7.7).
- Lucht/water-warmtepomp met een Kiwa-verklaring (91850/03), voor verwarming en tapwater. Verwarming: COP 4,60, energiefractie 0,986 en hulpenergie 55 kWh, zoals het rapport ze uit tabel 2.2 van de verklaring neemt (30–35 °C, Q_H;nd/A_g > 150 MJ/m²); de rest levert een elektrisch element. Tapwater: COP 1,95. Installatiejaar 2022.
- Tweepijps, 35 °C, leidinggegevens onbekend (de kern geeft dezelfde forfaitaire 148,23 m), geïsoleerd, geen aanvullende pomp. Vloerverwarming, regeling per ruimte met handmatig overrulen.
- Balansventilatie D.2 forfaitair, enthalpiewisselaar (tabel 11.18, 0,75), 100 % bypass, constant-volumeregeling, toevoerkanaal onbekend, automatische passieve koelregeling. Ventilatoren forfaitair.
- Compressiekoeling forfaitair met vloerkoeling, watergedragen 17/21 °C, pomp 33 W met EEI 0,23, twee bouwlagen.
- PV: 24 panelen JA-Solar JAM60S21-360-HC BK van 360 Wp, zuidwest, 35°, matig geventileerd. BCRG-verklaring 20201714GK: 190 W/m² bij 1,86 m² per paneel.

Per post, elektriciteit in kWh/jr (BENG 2-effect = verschil × 1,45 / 231,61):

| Post | Rapport | Kern | Verschil in BENG 2 |
|---|---|---|---|
| Verwarming, warmtepomp en element (warmte) | 3 326 (13 864) | 3 265 (circa 13 620) | −0,39 |
| Hulpenergie verwarming | 55 | 55 | 0 |
| Tapwater | 3 157 | 3 157 | 0 |
| Ventilatoren, met vorstbeveiliging | 987 | 987 | 0 |
| Koeling, opwekker | 112 | 146 | +0,22 |
| Hulpenergie koeling | 1 | 88 | +0,54 |
| PV (op de meter) | 7 226 | 7 094 | +0,83 |
| **BENG 2** | **2,59** | **3,79** | **+1,20** |

- **Verwarming en tapwater.** Beide rapportposten volgen uit de verklaarde rendementen met f_prac 0,95: 13 664 / (4,60 × 0,95) + 200 = 3 326 kWh en 5 849 / (1,95 × 0,95) = 3 157 kWh. De kern rekent zo ook; het verschil bij verwarming komt alleen uit de lagere warmtevraag.
- **PV.** Uniec telt 24 × 360 Wp = 8 640 Wp. De kern volgt (16.4) met K_pk naar beneden afgerond op 5 W/m² (2020 p. 651): 190 × 44,64 = 8 482 Wp. Dat is ook het vermogen dat het energielabel in hetzelfde rapport noemt. Met 8 640 Wp geeft de kern precies de 7 226 kWh van het rapport. De tekst van 2020+A1 zegt dat het piekvermogen met (16.4) "kan" worden berekend; geval A (Uniec 3.0.16) volgde wel de afronding, geval F (Uniec 3.0.19.4) niet. De kern houdt de afronding van punt 68 aan.
- **Koeling.** De kern rekent een netto koudebehoefte van 274 kWh met een afgifteverlies volgens 10.15 van 176 kWh (64 %). Het rapport noemt 337 kWh koude voor het systeem; bij dezelfde netto behoefte is dat een verlies van ongeveer 23 %. De hulpenergie is de regelenergie van 10.87 (87,6 kWh). Dit zijn de bekende vragen bij 10.15 en 10.87 (zie [nta8800-vragen-nen.md](nta8800-vragen-nen.md)).
- **BENG 1.** De kern rekent 0,8 % minder (74,06 tegen 74,69). Acht ramen hebben in het rapport een zijbelemmering: twee op NO, vijf op ZW (onder meer de pui van 7,59 m²) en één op NW, samen 19,83 m² van 45,48 m² glas (44 %). De uitdraai geeft per raam de hoogte, de afstand en de breedte, in een blok dat bij tekstextractie wegvalt. Met b_b = afstand / breedte (2020 p. 669) staan ze per raam in `windowObstructions`: V0.5 0,32 en V0.6 0,83 (beide ≥ 2,5 m hoog, dus met de koelvoorwaarde van p. 672), A0.4 0,37, A0.5 0,88, A0.6 1,83, A0.7b 2,44, A0.8 3,32 (< 2,5 m) en R0.1 0,12 (links, < 2,5 m). De eerste herbouw, van vóór de belemmering per raam, rekende met minimale belemmering: 73,49 / 3,68 / 96,4. TOjuli is 0, net als in het rapport (actieve koeling).

**Gevonden fout in de kern.** De witte rolluiken zijn een apparaat uit tabel 7.5 (`movableShading.device`). Zonder eigen `reductionFactor` bleef dat veld NaN en kwam het zo in de afgeleide invoer, waarna de controle op eindige getallen de hele berekening weigerde (`non_finite_result`). Elk project met een zonwering uit tabel 7.5 of 7.6 kon daardoor niet rekenen. Het veld wordt nu weggelaten als het niet is opgegeven (test `shading_device_serialises_without_reduction_factor`).

## G in 2024 en H, het eerste utiliteitsgebouw, in 2023 (9 oktober 2026)

Tot nu toe kwamen alle gevallen uit de periodes van 2020+A1 tot en met 2023, en alle waren woningen. G is gerekend met software die NTA 8800:2024 toepast. H is het eerste utiliteitsgebouw. De tests zijn `case_g_under_nta_8800_2024` en `case_h_utility_under_nta_8800_2023` in `crates/nta8800-core/tests/public_comparison.rs`. Beide staan ook in de referentiesuite `training-data/reference-suites/openbare-gevallen.json`.

| Geval | Rapport | Kern in de eigen editie | Verschil BENG 1 / 2 / 3 |
|---|---|---|---|
| G (2024), vrijstaande woning met kelder, 369,10 m² | 64,52 / 29,44 / 70,6 | 65,42 / 29,71 / 72,1 | +1,4 % / +0,9 % / +1,5 %-punt |
| H (2023), kantoor, bijeenkomst, zorg en sportschool, 743,80 m² | 29,08 / 80,01 / 30,5 | 27,29 / 80,63 / 29,7 | −6,2 % / +0,8 % / −0,8 %-punt |

### G: vrijstaande woning met verwarmde kelder (Uniec 3.3.5.0, 29-04-2025)

Herbouw:
- Gevels Rc 4,71 per oriëntatie (bruto 40,11 / 80,10 / 52,90 / 74,68 m²), daken Rc 7,30 onder 45° en 48°.
- Kelder: keldervloer 150,63 m², P 56,13 m, z 2,92 m en kelderwanden Rc 3,71 (8.38/8.39). Lineaire koudebruggen forfaitair.
- 21 ramen U 1,1 / g 0,60, een dakraam U 0,92 / g 0,50 en een paneel U 1,6.
- Belemmering per raam uit de uitdraai:
  - zijbelemmering met b_b = afstand / breedte bij D, E, C (hoogte ≥ 2,5 m) en N, P (beide zijden, < 2,5 m);
  - constante overstek bij J, met h_o = hoogte / afstand = 1,10 / 1,16 (17.3.5);
  - overstek met zijbelemmering bij G (situatie g met h_o 0,93);
  - "overige belemmering" zonder geometrie bij KA en KB (situatie g, tabel 17.13).
- Bodemwarmtepomp volgens tabel 9.28, 40 °C, met een los vat van 300 l. Kokendwatertoestel van 7 l, label A.
- Koudeopslag in de bodem met EER 10, als bron van de warmtepomp; niet aangetoond dat de bron boven 0 °C blijft (10.84).
- C.4c met P 199,1 W en f 0,155.
- PV 26 m² × 225 Wp/m², oost, 29°.

Per post, elektriciteit in kWh/jr (BENG 2-effect = Δ × 1,45 / 369,10):

| Post | Rapport | Kern | BENG 2 |
|---|---|---|---|
| Warmtepomp verwarming | 4 366 | 4 515 | +0,59 |
| Hulpenergie verwarming | 318 | ca. 328 | +0,04 |
| Tapwater (warmte uit de opwekkers) | 5 545 (7 317) | 5 545 (7 317) | 0 |
| Koeling incl. hulpenergie | 1 127 | ca. 1 037 | −0,35 |
| Ventilatoren | 300 | 300 | 0 |
| PV (op de meter) | 4 164 | 4 164 | 0 |
| **BENG 2** | **29,44** | **29,71** | **+0,27** |

De kern rekent hier met de gedeclareerde f_ctrl 0,51 en de screens op het dakraam (9 oktober 2026). Daarvoor, met tabel 11.5 en zonder zonwering per raam: 65,67 / 30,89 / 71,8, verwarming 4 747 kWh. De hulpenergie is per dienst uitgesplitst; de verdeling tussen verwarming en koeling is benaderd met de 10 kWh koelhulpenergie van de eerste herbouw.

- **Tapwater.** Netto behoefte 13.15/13.18 (2024 p. 521–522): 856 × (1,28 + 0,01 × 369,10) = 4 255 kWh. Beide vaten hebben f_sto;dis;ls 2 (2024 p. 552–553): alle aansluitingen zijn geïsoleerd, met T-stukken en kleppen, en een elektrisch toestel zonder meetgegevens krijgt ook 2. Een eerste herbouw nam 1 en gaf 869 kWh vatverlies te weinig; dat was een invoerfout, geen fout in de kern.
- **Verwarming.** De COP is gelijk (4,25), de warmte is 8,7 % hoger.
  - f_ctrl is nu gelijk aan het rapport: 0,51 uit de BCRG-gelijkwaardigheidsverklaring 20201914GG voor de Itho CVE/CVD ECO Optima 2 GG (C.4c), in plaats van 0,59 uit tabel 11.5. Dat verlaagt de verwarming met 232 kWh (−1,18 BENG 2).
  - Wat overblijft (+0,59) is warmtebehoefte. Twee ramen hebben "overige belemmering" zonder maat, wat voor verwarming de conservatieve tabel 17.13 geeft.
  - De screens op het dakraam (buiten, donker, handbediend; tabel 7.5) staan nu per raam in de invoer. Ze verlagen BENG 1 met 0,25 en raken BENG 2 niet.
  - BENG 1 rekent met de vaste C1-ventilatie en verschilt daarom maar 1,8 %.
- **Koeling.** De kern rekent letterlijk 10.15: 5 886 kWh koude tegen 4 157. De toeslag van 10.84 voor regeneratie en de EER 10 vallen daardoor bijna tegen elkaar weg.

### H: utiliteitsgebouw met sportschool (Uniec 3.2.9.2, 29-05-2024)

Twee rekenzones:
- RZ-1 is kantoor 14,70 m², bijeenkomst overig 26,30 m², gezondheidszorg overig 27,60 m² en de gemeenschappelijke ruimte van 49,20 m².
- RZ-2 is de sportzaal van 626,00 m².

De gemeenschappelijke ruimte "wordt gebruikt ten behoeve van" alle vier de functies. De herbouw verdeelt haar naar rato van hun A_g: kantoor 1,04, bijeenkomst 1,86, zorg 1,95 en sport 44,35 m². Met die verdeling zijn de Bbl-grenswaarden van de kern precies die van het rapport: 44,94 / 86,22 / 30,4. Dat bevestigt de verdeling.

Verder:
- Gevels Rc 4,70, daken Rc 6,30 onder 20° en vloeren Rc 3,70.
- Tussenwand en verdiepingsvloer naar een aangrenzende verwarmde ruimte (AVR) zonder verlies. A_ls van de kern is dan 1 217,61 m², gelijk aan het rapport.
- Alle lineaire koudebruggen met lengte en Ψ uit de uitdraai.
- De omtrek van de vloervelden staat niet in de uitdraai. Aangenomen is de lengte van de funderingsaansluitingen: RZ-1 22,57 m, RZ-2 31,77 m.
- Buitenluchtwarmtepomp, tabel 9.29, 45 °C, COP 3,05. Vloerverwarming in een vertrek van 4–6 m (afgifteroute 2023).
- Tapwater met een luchtwarmtepomp en een los vat van 200 l, f_sto;dis;ls 4.
- D.2 met centrale WTW, tegenstroom aluminium 0,75 en forfaitaire ventilatoren.
- Compressiekoeling forfaitair.
- Verlichting forfaitair, handbediend. PV 66 m² × 200 Wp/m², west, 20°.

Per post, elektriciteit in kWh/jr (BENG 2-effect = Δ × 1,45 / 743,80):

| Post | Rapport | Kern | BENG 2 |
|---|---|---|---|
| Warmtepomp verwarming (warmte) | 4 382 (13 366) | 3 989 (12 166) | −0,77 |
| Hulpenergie verwarming | 319 | 295 | −0,05 |
| Tapwater | 7 961 | 7 961 | 0 |
| Hulpenergie tapwater en koeling | 195 | 283 | +0,17 |
| Koeling | 2 363 | 2 993 | +1,23 |
| Ventilatoren | 1 180 | 1 195 | +0,03 |
| Verlichting | 34 294 | 34 294 | 0 |
| PV (op de meter) | 9 652 | 9 652 | 0 |
| **BENG 2** | **80,01** | **80,63** | **+0,62** |

- **Gelijk.**
  - Verlichting: forfaitair vermogen per functie en handbediende vertrekschakeling, hoofdstuk 14.
  - Tapwater: tabel 13.1 per functie.
  - PV en de COP.
- **Koeling** is weer de letterlijke lezing van 10.15. De **hulpenergie** bevat de 87,6 kWh regelenergie van 10.87, die de rapporten niet tellen (zie A–C).
- **Verwarming en BENG 1** (−6,2 %). De onzekere invoer is:
  - de aangenomen vloeromtrek;
  - de verdeling van de gemeenschappelijke ruimte over de zones;
  - de ruimtehoogte (RZ-1 3 m, RZ-2 5 m; de uitdraai geeft alleen "4 < h ≤ 6 m" voor de afgifte).

### Wat dit zegt over de kern

- **Gelijk.** Op de posten waar de invoer volledig in de uitdraai staat, zijn kern en rapport gelijk tot op de kWh:
  - G: tapwater, PV, ventilatoren, COP;
  - H: verlichting, tapwater, PV, COP en de Bbl-grenswaarden van een gemengd utiliteitsgebouw.
- **Interpretatie.** De verschillen liggen bij koeling (10.15 en 10.87, open vraag aan NEN).
- **Invoerroutes die ontbraken** en sinds 9 oktober 2026 in de kern zitten (zie hieronder):
  - een gedeclareerde f_ctrl uit een gelijkwaardigheidsverklaring (BCRG);
  - zonwering op één raam.
- **Invoer die de uitdraai niet geeft:** belemmering zonder maat, vloeromtrek.

### Gedeclareerde f_ctrl en zonwering per raam (9 oktober 2026)

G en A lieten twee invoerroutes zien die de kern niet had. Beide zijn toegevoegd.

- **Gedeclareerde f_ctrl** (`ventilation.system.unit.declaredControlFactor`, met `value` en `declarationReference`).
  - Basis: tabel 11.5 geeft rekenwaarden voor gangbare systeemvarianten (2025+C1 p. 460). Een forfaitaire waarde mag worden vervangen door een waarde uit een kwaliteitsverklaring van het toegepaste systeem (p. 7). De BCRG-gelijkwaardigheidsverklaringen noemen f_ctrl per systeem.
  - De waarde vervangt f_ctrl;tabel 11.5 in 11.48/11.49. Bij E.1 vervangt zij f_ctrl;overig in 11.51/11.52; f_ctrl van het decentrale D.5b-deel ligt vast en is daar niet op te geven.
  - Geldig: groter dan 0 en ten hoogste 2, met een verklaring als bron. Geldt in alle edities.
- **Zonwering per raam** (`windowShadings`, met per raam `movableShading` en een bron).
  - Basis: 7.42 en 7.43 geven g_gl en F_c per raam wi (2025+C1 p. 196–198).
  - Een raam in de lijst krijgt zijn eigen zonwering, ook "geen"; een raam dat er niet in staat houdt `windowSolar.movableShading`.
  - Dezelfde routes als de projectbrede zonwering: tabel 7.5/7.6 of een opgegeven F_c, met de regeling van tabel 7.7–7.9.
- **Zonder de nieuwe invoer** rekent elk project precies als voorheen (test `window_shading_equal_to_the_default_changes_nothing`).

| Geval | Rapport | Voor | Na |
|---|---|---|---|
| A (2025+C1) | 92,99 / 25,19 / 80,4 | 94,00 / 35,15 / 74,9 | 94,00 / 34,37 / 74,9 |
| A (2020+A1) | 92,99 / 25,19 / 80,4 | 94,00 / 36,06 / 74,4 | 94,00 / 35,29 / 74,4 |
| G (2024) | 64,52 / 29,44 / 70,6 | 65,67 / 30,89 / 71,8 | 65,42 / 29,71 / 72,1 |

- **A:** f_ctrl 0,50 in plaats van 0,59 verlaagt de verwarming met 56 kWh (−0,78 BENG 2). Wat blijft is 10.15 en 10.87.
- **G:** BENG 2 ligt nu 0,27 boven het rapport (was 1,45). Dat is het verschil in warmtebehoefte door de belemmeringen zonder maat, minus het koelverschil.

### Gezochte rapporten (9 oktober 2026)

Gezocht op repository.officiele-overheidspublicaties.nl, planviewer.nl, gemeentesites en raadsinformatiesystemen, naar rapporten met Uniec 3.3 of later of met Vabi uit de periode van NTA 8800:2024 (vanaf 1 juli 2024) of 2025+C1 (vanaf 29 mei 2026), en naar utiliteitsgebouwen.

| Rapport | Periode | Uitkomst |
|---|---|---|
| [woning B, Uniec 3.3.5.0, 29-04-2025](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2025/til-2025-25471/1/bijlage/BENG_woning_B.pdf) | 2024 | nagebouwd als G |
| [bedrijfsgebouw met sportschool, Uniec 3.2.9.2, 29-05-2024](https://heusden.bestuurlijkeinformatie.nl/Document/View/3256b603-e6fb-4fa0-ab2c-b63fa0af6d28) | 2023 | nagebouwd als H |
| [woning, Uniec 3.2.7.0, 18-03-2024](https://www.oud-osdorp.nl/wp-content/uploads/2024/03/Rap.-BENG-berekening-V1.0_18-03-2024.pdf) | 2023 | is al geval C |
| [Rijksstraatweg, BENG en MPG, 24-01-2022](https://www.planviewer.nl/imro/files/NL.IMRO.0531.pb25Rijksstrwg52-3001/b_NL.IMRO.0531.pb25Rijksstrwg52-3001_bd10.pdf) | 2020+A1 | niet nagebouwd: niet in een van de gezochte edities |

Geen openbaar rapport uit de periode van 2025+C1 gevonden; de uitgave is pas sinds 29 mei 2026 aangewezen. Een utiliteitsgebouw onder 2024 is ook niet gevonden.

### Gezochte rapporten onder 2025+C1 (9 oktober 2026, tweede ronde)

Sinds 29 mei 2026 moet elke berekening die in EP-Online wordt geregistreerd met Uniec 3.4 zijn gemaakt ([Uniec 3](https://uniec3.nl/wanneer-moet-ik-uniec-versie-3-4-gebruiken/)); de meest recente versie is 3.4.4.0 van 12 juli 2026. Een openbaar rapport in de periode van 2025+C1 herken je dus aan "Uniec 3.4" in de voetregel en een rekendatum vanaf 29 mei 2026.

Gezocht op repository.officiele-overheidspublicaties.nl (ter-inzage-leggingen 2026), planviewer.nl, gemeentesites en websites van adviseurs, met onder meer "Uniec 3.4", "NTA 8800:2025+C1", "Rapportage Energieprestatie (NTA 8800)" met 2026, en naar utiliteitsgebouwen (kantoor, school).

| Gevonden | Periode | Uitkomst |
|---|---|---|
| [The View 2, installaties bij aanvraag (ter inzage 2026)](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2026/til-2026-16676/1/bijlage/0.062_VII-ARC-RP-ME-0100-Toelichting_en_berekeningen_installaties.pdf.pdf) | rapport van 15-12-2022 | geen BENG-uitdraai uit de periode van 2025+C1 |
| [Krimpenerwaard, woongebouw met bedrijfsruimte, Uniec 3.0.19.4, 07-04-2022](https://www.krimpenerwaard.nl/sites/default/files/2024-10/15.%202022068_beng_svds_a0_pdf%20(geanonimiseerd)_0.pdf) | 2020+A1 | niet in de gezochte uitgave; de winkelruimte is sindsdien nagebouwd als J |
| [Seafarm, kantoor in bedrijfspand, Uniec 3.0.9.3, 01-04-2021](https://www.noord-beveland.nl/sites/noord_beveland/files/2022-02/Rapportage_BENG_berekening_Geredigeerd_0.pdf) | 2020+A1 | niet in de gezochte uitgave; sindsdien nagebouwd als I |

Geen openbaar rapport met Uniec 3.4 gevonden. Bij een omgevingsvergunning wordt de BENG-berekening meestal pas na het besluit ter inzage gelegd; vier maanden na 29 mei 2026 is dat voor de meeste aanvragen nog niet gebeurd. De acceptatie onder 2025+C1 blijft daarom voorlopig de berekening van A–C in 2025+C1 naast hun eigen uitgave (zie hierboven) en de referentiesuites. Opnieuw zoeken als er ter-inzage-leggingen met Uniec 3.4 verschijnen.

## I en J, twee utiliteitsgevallen in 2020+A1 (9 oktober 2026)

Twee openbare rapporten uit de vorige zoekronde, beide uit de periode van NTA 8800:2020+A1, zijn nagebouwd: I is een kantoor met bijeenkomstfunctie, J een winkelruimte onder appartementen. Daarmee zijn er drie utiliteitsgevallen (H, I, J). De test is `case_i_utility_under_nta_8800_2020_a1` en `case_j_retail_under_nta_8800_2020_a1` in `crates/nta8800-core/tests/public_comparison.rs`; de suite `training-data/reference-suites/openbare-gevallen.json` heeft ze als `openbaar-i-2020a1` en `openbaar-j-2020a1`. BENG 1 / BENG 2 / BENG 3:

| Geval | Rapport | Kern (2020+A1) | Eisen in rapport en kern |
|---|---|---|---|
| I | 75,26 / −36,81 / 143,8 | 75,51 / −19,41 / 119,4 (was 81,02 / −13,31 / 112,3, zie warmtecapaciteit) | 97,96 / 44,06 / 30,0 |
| J | 63,92 / 46,11 / 30,1 | 63,75 / 51,46 / 27,9 (was 67,19 / 54,49 / 26,7, zie warmtecapaciteit) | 75,19 / 60,00 / 30,0 |

### Kernfout: tapwaterwarmtepomp forfaitair zonder c_W;gen

J liet een fout in de kern zien. De kern vermenigvuldigde het forfaitaire opwekkingsrendement van een tapwaterwarmtepomp (1,4, of 1,4 · c_source) met c_W;gen van tabel 13.27 voor klasse 4. Bij een kleine tapwatervraag is dat 0,45: de ventilatiewarmtepomp van J kreeg 0,63 en gebruikte 200 kWh in plaats van de 90 kWh van het rapport. Tabel 13.25 geeft de warmtepompen 1,4 en 1,4 · c_source zonder c_W;gen; alleen de gasrijen dragen c_W;gen (2020+A1 p. 612, 2025+C1 p. 641). 13.8.4.7.3 c) bepaalt c_W;gen uit "de toepassingsklasse waarbij het rendement van de warmtepomp is gemeten" (2020+A1 p. 615, 2025+C1 p. 643). De kern corrigeert nu alleen bij een gemeten klasse (`measuredClass`). Test `forfait_heat_pump_takes_no_class_correction`. Woningen met een forfaitaire tapwaterwarmtepomp en een bruto tapwatervraag onder 3 890 kWh rekenen daardoor met minder tapwaterelektriciteit; de openbare gevallen A–H veranderen niet (C heeft een vraag boven 3 890 kWh, de andere een productverklaring).

### I: kantoor met bijeenkomstfunctie (Uniec 3.0.9.3, 01-04-2021)

Een rekenzone van 439,04 m²: kantoor 251,80, bijeenkomst overig 64,08 en een gemeenschappelijke ruimte van 123,16 m², naar rato over beide functies verdeeld. Daarmee zijn de eisen van de kern gelijk aan die van het rapport. Herbouw:
- Gevels NW en W met triple glas (U 1,4, g 0,50), plat dak Rc 6,30, vloer op of boven maaiveld Rc 3,70 (R_f 3,87 met R_si). De rekenzone en de gemeenschappelijke ruimte zijn samengevoegd; lineaire bruggen per oriëntatie opgeteld.
- Twee ramen op NW hebben een zijbelemmering rechts van ten minste 2,5 m hoog: receptie op 7,73 m afstand en entree op 2,53 m, beide 37,85 m breed (b_b 0,204 en 0,067, de koelvoorwaarde geldt).
- Lucht/lucht-warmtepomp forfaitair (COP 2,80, installatiejaar 2021) met recirculatieluchtverwarming (Δθ 1,1 K, tabel 9.7) en forfaitaire luchtverwarmerventilatoren (tabel 9.13, indirect, met terugkeer van warme lucht).
- Balansventilatie D.2 met tegenstroom-WTW 0,75 en 100 % bypass; elektrisch doorstroomtoestel (0,95); compressiekoeling EER 3,00 met directe expansie aan het plafond en 20 ventilatoren van 10 W.
- 125 PV-panelen van 300 Wp, zuidoost 15°, sterk geventileerd. Het paneeloppervlak staat niet in de uitdraai; de fixture neemt 1,5 m² (200 W/m²), zodat de afronding van punt 68 niets afhaalt.
- Verlichting met een eigen vermogen van 6,00 W/m², hand aan/uit, geen daglichtregeling.
- **Warmtecapaciteit.** Het rapport geeft "staalskeletbouw met staalbeton of niet-massieve betonnen vloeren", 250 tot 500 kg/m², 110 kJ/(m²K), gesloten verlaagd plafond en C_m;int;eff 48 290 000 J/K (= 110 · 1000 · 439,04). Dat is de rij 250–500 kg/m² van tabel 7.10 (2020+A1 p. 179–180).
  - De eerste herbouw nam de lichte rij (minder dan 250 kg/m², 55 kJ/(m²K)). Gecorrigeerd op 9 oktober 2026 (fixture: vloer zwaar, wand licht, dezelfde codering als K), na dezelfde fout bij K.
  - Gevolg: BENG 1 81,02 → 75,51 (rapport 75,26), BENG 2 −13,31 → −19,41, BENG 3 112,3 → 119,4. Koudebehoefte 12 315 → 10 456 kWh, warmtebehoefte 12 678 → 11 716 kWh.

Per post, elektriciteit in kWh/jr; verschil in BENG 2 = Δ · 1,45 / 439,04. Tussen haakjes de kern vóór de correctie van de warmtecapaciteit:

| Post | Rapport | Kern | Verschil in BENG 2 |
|---|---|---|---|
| Verwarming | 4 807 | 4 468 (4 840) | −1,12 (+0,11) |
| Hulpenergie verwarming | 293 | 289 (316) | −0,01 (+0,08) |
| Tapwater (met hulpenergie) | 866 | 866 | 0 |
| Koeling | 4 023 | 9 509 (10 957) | +18,12 (+22,90) |
| Hulpenergie koeling | 628 | 716 | +0,29 |
| Ventilatoren | 1 411 | 1 411 | 0 |
| Verlichting | 7 446 | 7 484 | +0,13 |
| PV (op de meter) | 30 621 | 30 621 | 0 |
| **BENG 2** | **−36,81** | **−19,41 (−13,31)** | **+17,40 (+23,50)** |

- **Koeling.** De kern rekent nu een koudebehoefte van 10 456 kWh, plus de ontvochtiging Q_C;dhum van 12.5 en het verlies van 10.15 letterlijk: samen 28 527 kWh koude (was 32 871). Het rapport noemt 12 069 kWh als totale koudebehoefte, wat met EER 3,00 precies de 4 023 kWh geeft; Uniec 3.0.9.3 telde ontvochtiging en 10.15 dus niet mee. 12.3 en tabel 12.2 rekenen directe expansie als een systeem van 6/12 °C en dus met ontvochtiging (2020+A1 p. 500–501, 2025+C1 p. 523–524). Met de zwaardere rij ligt de voelbare behoefte van de kern nu 1 613 kWh onder die van het rapport (was +246); de verdeling van het restverschil over ontvochtiging en 10.15 is zonder de maandwaarden van het rapport niet vast te stellen.
- **Hulpenergie koeling.** 20 ventilatoren van 10 W over 3 141 bedrijfsuren zijn de 628 kWh van het rapport; de kern telt daar de regelenergie van 10.87 bij (87,6 kWh).
- **Verlichting.** 14.3.2 rondt P_n naar boven af op twee significante cijfers volgens bijlage X (2020+A1 p. 631): 1 895 → 1 900 W en 739 → 750 W.
- **Verwarming** is nu 7 % lager dan het rapport (was 0,7 % hoger). Het rapport geeft alleen het elektriciteitsgebruik, niet de warmtebehoefte, dus de oorzaak is uit de uitdraai niet te herleiden.
- **BENG 1** ligt nu 0,3 % boven het rapport (75,51 tegen 75,26; was 7,7 %). Het verschil in verliesoppervlakte blijft open: het rapport noemt 906,83 m², de opgegeven vlakken tellen op tot 1 041,37 m².

### J: winkelruimte onder appartementen (Uniec 3.0.19.4, 06-04-2022)

Een rekenzone van 89,80 m² winkelfunctie onder twee appartementen (die apart zijn berekend en niet zijn nagebouwd). Herbouw:
- Gevels W, Z, O en N (Rc 4,70), een plat dak van 15,21 m² (Rc 6,30) en een vloer boven een kruipruimte (Rc 4,00, P 34,99 m, kruipruimteventilatie 0,0012 m²/m, R_bw 4,70). h van (8.47) staat niet in de uitdraai; de fixture neemt 0,00 m. Geen lineaire bruggen in de uitdraai, dus de forfaitaire toeslag.
- Ventilatiewarmtepomp voor verwarming (COP 4,50, 35 °C, installatiejaar 2022) met vloerverwarming; een tweede ventilatiewarmtepomp met geïntegreerd vat (0,6 kW) voor tapwater, met tabel 13.25: 1,4.
- Ventilatiesysteem C.4c (f_ctrl 0,82); compressiekoeling EER 3,00 met vloerkoeling 17/21 en een pomp van 33 W (EEI 0,23).
- 4 PV-panelen van 360 Wp, zuid 23°, matig geventileerd; paneeloppervlak aangenomen 1,8 m² (200 W/m²). Verlichting 7,00 W/m².
- **Warmtecapaciteit.** Het rapport geeft "dragend metselwerk met massieve betonnen vloeren", gesloten of verlaagd plafond. Dat is de rij meer dan 750 kg/m² van tabel 7.10, 250 kJ/(m²K) (2020+A1 p. 180), zoals bij D en E.
  - De eerste herbouw codeerde vloer en wand als zwaar, de rij 500–750 kg/m² (180 kJ/(m²K)). Gecorrigeerd op 9 oktober 2026 (vloer en wand zeer zwaar), bij de controle van I.
  - Gevolg: BENG 1 67,19 → 63,75 (rapport 63,92), BENG 2 54,49 → 51,46, BENG 3 26,7 → 27,9. Koudebehoefte 1 869 → 1 656 kWh, warmtebehoefte 3 368 → 3 244 kWh.

Per post, elektriciteit in kWh/jr; verschil in BENG 2 = Δ · 1,45 / 89,80. Tussen haakjes de kern vóór de correctie van de warmtecapaciteit:

| Post | Rapport | Kern | Verschil in BENG 2 |
|---|---|---|---|
| Verwarming | 978 | 971 (1 009) | −0,11 (+0,49) |
| Hulpenergie verwarming | 26 | 26 (27) | 0 (+0,01) |
| Tapwater | 90 | 90 | 0 |
| Koeling | 697 | 948 (1 098) | +4,05 (+6,48) |
| Hulpenergie koeling | 94 | 181 | +1,41 |
| Ventilatoren | 44 | 44 | 0 |
| Verlichting | 2 162 | 2 162 | 0 |
| PV (op de meter) | 1 235 | 1 235 | 0 |
| **BENG 2** | **46,11** | **51,46 (54,49)** | **+5,35 (+8,38)** |

- **Koeling.** Vloerkoeling ontvochtigt niet. De kern rekent een behoefte van 1 656 kWh (was 1 869) plus het verlies van 10.15 letterlijk en de teruggewonnen pompwarmte: samen 2 845 kWh koude (was 3 294); het rapport 2 092 kWh. Dat is de bekende lezing van 10.15 ([vragen aan NEN](nta8800-vragen-nen.md)).
- **Hulpenergie koeling.** De regelenergie van 10.87 (87,6 kWh).
- **Verwarming.** De kern rekent 4 370 kWh warmte (0,7 % minder dan 4 400; was 4 538, 3 % meer); BENG 1 ligt 0,3 % onder het rapport (63,75 tegen 63,92; was 5,1 % hoger).
- **Tapwater** en de **hulpenergie van de warmtepomp** waren eerst ook anders: 200 kWh (de kernfout hierboven) en 101 kWh (A = 87,6 voor een toestel zonder installatiejaar, punt 74). Met de correctie en het installatiejaar 2022 (A = 13,0) zijn ze gelijk aan het rapport.

### Wat I en J toevoegen

- De verdeling van een gemeenschappelijke ruimte naar rato over de functies geeft opnieuw exact de eisen van het rapport (na H ook I).
- Ventilatoren, verlichting met eigen vermogen, PV, tapwater en het warmtepomprendement komen overeen; de grote verschillen zitten weer bij koeling.
- Nieuw ten opzichte van H: bij directe expansie telt de kern de ontvochtiging van 12.5 mee, die Uniec 3.0.9.3 niet meetelde. De norm is daarin duidelijk: 12.3 rekent directe expansie als 6/12 °C, en hoofdstuk 10, OPMERKING 2 bij de afgiftesystemen, gaat bij directe expansie uitdrukkelijk uit van ontvochtiging, met een verwijzing naar 12.3 (2025+C1 p. 371, 2020+A1 p. 347).

## K en L, een sporthal en een basisschool in 2022 (9 oktober 2026)

Twee utiliteitsrapporten uit de periode van NTA 8800:2022 zijn nagebouwd: K is een sporthal met kantoor en bijeenkomstfunctie, L een basisschool met gymzaal. Daarmee zijn er vijf utiliteitsgevallen (H–L), waaronder het eerste onderwijsgebouw. De tests zijn `case_k_sports_hall_under_nta_8800_2022` en `case_l_school_under_nta_8800_2022` in `crates/nta8800-core/tests/public_comparison.rs`. De suite `training-data/reference-suites/openbare-gevallen.json` heeft ze als `openbaar-k-2022` en `openbaar-l-2022`. Beide zijn met Uniec 3.1.5.0 berekend (11-12-2022 en 02-01-2023); net als bij E telt dat als de uitgave 2022. BENG 1 / BENG 2 / BENG 3:

| Geval | Rapport | Kern (2022) | Eisen in rapport en kern |
|---|---|---|---|
| [K](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2024/til-2024-19434/1/bijlage/Bijlage_17_2022-4978_Rapportage_BENG_pro_formapdf_fc10d433-2427-ef11-844c-005056a12c84.pdf) | 29,68 / −0,79 / 101,0 | 29,57 / −0,90 / 101,1 | 50,34 / 84,87 / 30,0 |
| [L](https://www.centraledorpenraad.nl/wp/wp-content/uploads/B48-uniec3-18363-OBS-De-Weidevogel.pdf) | 111,52 / 25,36 / 76,9 | 111,44 / 18,63 / 80,2 | 140,15 / 74,99 / 36,1 |

**Bbl-eisen per gebruiksfunctie.** In beide gevallen zijn de gemeenschappelijke ruimten naar rato van A_g verdeeld over de functies die ze gebruiken. Daarmee geeft de kern precies de gewogen eisen van het rapport, en ook A_ls/A_g (K 1,99, L 1,96).
- K: kantoor 83,09, bijeenkomst overig 185,79 en sport 1 628,10 m².
- L: onderwijs 1 014,13, kantoor 24,01, bijeenkomst overig 111,66 en sport 504,17 m². De hoofdentree van 8,41 m² is over alle vier functies verdeeld; haar geometrie staat bij de rekenzone onderwijs.

### K: sporthal met kantoor en bijeenkomstfunctie (Uniec 3.1.5.0, 11-12-2022)

**Herbouw.**
- **Zones.** De rekenzone "Rekenzone" (kantoor en bijeenkomst, 2 bouwlagen, met de gemeenschappelijke ruimte "Hulpfuncties") en de rekenzone "industrie" met de sportfunctie (1 bouwlaag, geen plafond).
- **Schil.** Gevels Rc 5,50, platte daken Rc 7,50, vloer op maaiveld Rc 3,70 (P 176,19 m) en een vloer boven buitenlucht van 2,54 m². Alle ramen en deuren staan per stuk in de fixture, met de belemmeringen per raam (overstek, zijbelemmering beide, overige belemmering).
- **Koudebruggen.** De uitdraai noemt geen lineaire koudebruggen. De kern rekent daarom de forfaitaire route van 8.2/8.3 en 8.37 (2022 p. 200–201), zoals bij J. Zonder koudebruggen komt BENG 1 op 25,85, met de forfaitaire toeslag op het rapport.
- **Warmtecapaciteit.** "Hsb, sfb of staalskelet met staalbeton of niet-massieve betonnen vloeren" is de rij 250–500 kg/m² van tabel 7.10 (2022 p. 181): 110 kJ/(m²K) met gesloten plafond, 180 kJ/(m²K) zonder. De eerste herbouw nam de lichte rij (55/80) en kwam op 33,25 voor BENG 1.
- **Installaties.**
  - Verwarming: bodemwarmtepomp forfaitair (tabel 9.29, 35 °C, COP 3,40) met vloerverwarming.
  - Koeling: koudeopslag in de bodem (EER 10) met vloerkoeling 17/21.
  - Ventilatie: D.3 met enthalpiewisselaar 0,75, 100 % bypass en CO2-sturing (f_ctrl 1,00).
  - Tapwater: drie elektrische boilers (2 × 10 l label A, 300 l label C) met geïsoleerde leiding: f_sto;dis;ls 1,5 (2022 p. 550).
  - PV: 198 panelen JA-Solar JAM54S30-400 van 1,95 m² met 205,13 Wp/m² uit de kwaliteitsverklaring (kolom 2022), zuid 30°.
- **Verticale leiding.** De fictieve leiding van de ene toiletgroep (7.17a) staat in de rekenzone met kantoor en bijeenkomst.

Per post, elektriciteit in kWh/jr; verschil in BENG 2 = Δ · 1,45 / 1 896,98:

| Post | Rapport | Kern | Verschil in BENG 2 |
|---|---|---|---|
| Verwarming (warmte) | 12 052 (40 976) | 12 161 (41 346) | +0,08 |
| Hulpenergie verwarming | 801 | 808 | +0,01 |
| Tapwater | 27 769 | 27 769 | 0 |
| Koeling met hulpenergie | 2 123 | 2 150 | +0,02 |
| Ventilatoren | 2 955 | 2 955 | 0 |
| Verlichting | 25 370 | 25 084 | −0,22 |
| PV (op de meter) | 72 115 | 72 116 | 0 |
| **BENG 2** | **−0,79** | **−0,90** | **−0,11** |

- **Gelijk.** Tapwater, ventilatoren, PV, de COP en de eisen. De warmte verschilt 0,9 %.
- **Verlichting (−1,1 %).** De kern rondt P_n per verlichtingszone naar boven af volgens bijlage X. Voor de sporthal is dat 6 512 → 7 000 W; tabel X.1 springt van 65 naar 70. Hoe Uniec tot 286 kWh meer komt, is uit de uitdraai niet te herleiden.
- **Koeling.** De kern rekent 14 343 kWh koude, inclusief het letterlijke verlies van 10.15; het rapport noemt 11 484 kWh. De elektriciteit ligt toch dicht bij elkaar.

### L: basisschool met gymzaal (Uniec 3.1.5.0, 02-01-2023)

**Herbouw.**
- **Zones.**
  - Rekenzone onderwijs: onderwijs, kantoor en bijeenkomst, 2 bouwlagen, met de gemeenschappelijke ruimte naast de aula (34,85 m²) en de hoofdentree.
  - Rekenzone sport: de gymzaal, meer dan 4 K kouder ingesteld.
- **Schil.**
  - Gevels Rc 4,70 en hellende daken van 20° met Rc 6,30.
  - Vloeren boven een kruipruimte (Rc 3,70, ε 0,0012, R_bw 4,70, h 0,05 m) en een vloer op zand.
  - Bijna alle ramen hebben buitenscreens (overige kleur, automatisch), per raam ingevoerd (tabel 7.5/7.9). Daarnaast tien zijbelemmeringen met maat.
  - Geen lineaire koudebruggen in de uitdraai, dus de forfaitaire toeslag.
- **Warmtecapaciteit.** "Betonnen kolom-ligger skeletbouw met niet-massieve betonnen vloeren" is de rij 500–750 kg/m², 180 kJ/(m²K).
- **Verwarming.** Bodemwarmtepomp forfaitair (45 °C, COP 3,10) met een aanvullende pomp van 363 W (EEI 0,23).
  - Afgifte: vloerverwarming in de onderwijszone en plafondpanelen in de gymzaal. Beide hebben in de uitdraai een vertrekhoogte van meer dan 8 m.
  - De fixture neemt voor beide de gebouwhoogte van 9,28 m (9.19, tabel 9.8/9.10). Bij de vloerverwarming neemt ze de onbekende opbouw (Δθ_emb 1,9).
  - Dynamisch ingeregeld; regeling per ruimte met handmatig overrulen.
- **Ventilatie.** Luchtbehandelingskast buiten de thermische zone met verwarmings- en koelbatterij.
  - D.5a met roterende WTW 0,70 en 100 % bypass.
  - Kanalen buiten de zone: situatie 1 van tabel 11.19 (2022 p. 489).
  - Geïnstalleerde capaciteit 2 761,9 en 361,1 dm³/s, debietregeling tot 40 % (11.61).
- **Koeling.** Koudeopslag met vloerkoeling, alleen in de onderwijszone.
- **Tapwater.**
  - Systeem 1: zes elektrische boilers van 10 l, label A+, ongeïsoleerde aansluiting (f_sto;dis;ls 2), voor de onderwijszone en 312,07 m² van de gymzaal.
  - Systeem 2: een elektrisch doorstroomtoestel voor de rest van de gymzaal.
- **Verlichting.** 5,50 W/m², LED (L80) met nieuwwaardecompensatie (2022 tabel 14.4).
- **PV.** 203 m² met een eigen waarde van 310 Wp/m², west 20°; de fixture neemt dat letterlijk over.
  - 16.4 kent geen maximum voor K_pk (2020+A1 p. 651, 2022 p. 656–657, 2025+C1 p. 679–680). De grens van 300 W/m² in de kern was een eigen keuze en weigerde deze invoer ten onrechte.
  - Sinds rekenkern 0.4.0 weigert de kern pas boven 400 W/m² (een invoerfout); boven 300 W/m² geeft de registratiecontrole een plausibiliteitswaarschuwing.
  - Eerder nam de fixture hetzelfde piekvermogen als 300 W/m² over 209,77 m² (62 931 Wp, 46 018 kWh); nu is het 62 930 Wp en 46 017 kWh, gelijk aan het rapport.

Per post, elektriciteit in kWh/jr; verschil in BENG 2 = Δ · 1,45 / 1 653,96:

| Post | Rapport | Kern | Verschil in BENG 2 |
|---|---|---|---|
| Verwarming (warmte) | 28 380 (87 979) | 22 144 (68 645) | −5,47 |
| Hulpenergie verwarming | 2 425 | 2 118 | −0,27 |
| Tapwater met hulpenergie | 10 321 | 10 320 | 0 |
| Koeling met hulpenergie | 4 260 | 3 339 | −0,81 |
| Ventilatoren | 8 052 | 7 843 | −0,18 |
| Verlichting | 21 501 | 21 501 | 0 |
| PV (op de meter) | 46 017 | 46 017 | 0 |
| **BENG 2** | **25,36** | **18,63** | **−6,73** |

- **Gelijk.**
  - Verlichting (met de L80-compensatie), tapwater over twee systemen, PV, de COP en de eisen.
  - BENG 1 (−0,07 %). BENG 1 rekent met de vaste C1-ventilatie, dus schil, warmtecapaciteit en interne warmte kloppen.
- **Verwarming (−22 % warmte).** Het verschil zit in de rekening met het werkelijke ventilatiesysteem en de afgifte, niet in de schil.
  - De kern komt op een warmtebehoefte van 51 815 kWh; het rapport geeft alleen de warmte uit de opwekker.
  - Vanuit de uitdraai niet vast te stellen zijn de vertrekhoogte (alleen "> 8 m"), het type plafondverwarming en de toevoertemperatuur van de luchtbehandelingskast.
  - Een kernfout is niet gevonden. De routes voor de luchtbehandelingskast (tabel 11.15, 11.100/11.101) en voor de geïnstalleerde capaciteit (11.55–11.61, 2022 p. 447–450) volgen de norm.
  - Het onderwijsdebiet volgens de regelgeving is hoger dan de geïnstalleerde capaciteit maal f_τ en de terugregeling. Daardoor bepaalt 11.56 het debiet en heeft de debietregeling geen invloed.
  - Dit is het grootste open verschil van de utiliteitsgevallen. Het is geen vraag aan NEN: eerst zijn gegevens nodig die de uitdraai niet geeft (vertrekhoogte, type plafondverwarming).
- **Koeling.** De letterlijke lezing van 10.15, en 10.87, zoals bij de andere gevallen.

### Wat K en L toevoegen

- **Eisen.** De naar rato verdeelde gemeenschappelijke ruimte geeft opnieuw exact de eisen van het rapport (H, I, K, L). L is het eerste geval met een onderwijsfunctie en met een gemeenschappelijke ruimte die over twee rekenzones loopt.
- **Nieuwe invoerroutes in een openbaar geval.** Allemaal bestaande routes van de kern:
  - koudeopslag als koudeopwekker;
  - elektrische boilers met f_sto;dis;ls 1,5 (2022);
  - luchtbehandelingskast met batterijen en geïnstalleerde capaciteit;
  - afgifte in vertrekken boven 4 m;
  - een tweede tapwatersysteem;
  - verlichting met nieuwwaardecompensatie;
  - zonwering en belemmering per raam.
- **Les voor de herbouw.** Tabel 7.10 van 2022 kiest de rij op de bouwwijze. "Staalbeton of niet-massieve betonnen vloeren" hoort bij 250–500 kg/m², niet bij de lichte rij. De herbouw van I (2020+A1) gebruikte de lichte rij voor dezelfde omschrijving; dat is op 9 oktober 2026 gecorrigeerd (zie I).
- **Geen kernwijziging.** Er is geen rekenwijziging, dus geen ophoging van `KERNEL_VERSION`.

### Gezochte rapporten (9 oktober 2026, utiliteit 2022–2024)

Gezocht op repository.officiele-overheidspublicaties.nl, planviewer.nl, gemeentesites en websites van schoolbesturen en dorpsraden. Zoektermen waren onder meer "onderwijsfunctie" met "Uniec 3" en "Printdatum", "gezondheidszorgfunctie" met "Uniec", en "BENG berekening basisschool".

| Rapport | Periode | Uitkomst |
|---|---|---|
| sporthal met kantoor, Amersfoort, Uniec 3.1.5.0, 11-12-2022 | 2022 | nagebouwd als K |
| OBS De Weidevogel, Uniec 3.1.5.0, 02-01-2023 | 2022 | nagebouwd als L |
| [kantoorgebouw VH2 Delfzijl, Uniec 3.1.3.2, 12-10-2022](https://bestanden.provinciegroningen.nl/bestanden-openbaar/publicatievoorstel/KIWI_PublicatieVoorstel_IPPC_000000260002/D2023-110459%20GEANONIMISEERD%207964649_1690292347274_51009090-NL22-648800269-33734_BENG-rapport%20D2023-0.pdf) | 2022 | gevonden, nog te bouwen: een portiersloge en kantine van 36 m² (geen groot kantoor); de tekst is een scan met slechte tekstherkenning |
| [Hoek van Holland, 4 woningen, Uniec 3.1.6.2](https://repository.officiele-overheidspublicaties.nl/Bijlagen/TerInzageLegging/2024/til-2024-415/1/bijlage/26.2220837_-_Rap._BENG-berekening.pdf) en [exb-2022-48764](https://repository.officiele-overheidspublicaties.nl/externebijlagen/exb-2022-48764/1/bijlage/exb-2022-48764.pdf) | 2022 | woningen, geen utiliteit |

Een openbaar rapport van een zorggebouw of een groot kantoor met luchtbehandelingskast uit 2022–2024 is niet gevonden.

## Controle van de letterlijke invoer, alle openbare gevallen (9 oktober 2026)

Bij I, J en eerst K stond de bouwwijze uit de uitdraai op de verkeerde rij van tabel 7.10. Daarom zijn de andere gevallen (A–H, K, L) opnieuw naast hun uitdraai gelegd. Gecontroleerd zijn de invoer die de uitdraai letterlijk noemt:
- de bouwwijze, het type plafond en het aantal bouwlagen;
- Rc per dichte constructie, U en g per raam;
- q_v;10 en de invoer van de infiltratie;
- de ventilatievariant en het rendement van de warmteterugwinning;
- de opwekker met COP, energiefractie en hulpenergie, en de tapwateropwekker;
- de PV (Wp per m² of per paneel, aantal, hellingshoek en ventilatie);
- de gebruiksoppervlakte per gebruiksfunctie, inclusief de verdeling van de gemeenschappelijke ruimte.

**Bouwwijze.** Elk geval staat op de rij die de uitdraai noemt.

| Geval | Editie | Uitdraai | Rij in de kern | Aangepast |
|---|---|---|---|---|
| A | 2020+A1 | sfb met hsb- of sfb-vloeren, geen of open plafond | < 250 kg/m², 80 | nee |
| B | 2022 | dragend metselwerk met niet-massieve betonnen vloeren, 500–750 kg/m² | 360 | nee |
| C | 2023 | zone 1 staal-beton / dragend metselwerk, zone 2 staal-beton / hsb | 360 en 180 | nee |
| D | 2020+A1 | dragend metselwerk met massieve betonnen vloeren | > 750 kg/m² (massKgPerM2 800), 450 | klasse wand zeer zwaar → zwaar |
| E | 2022 | dragend metselwerk met massieve betonnen vloeren | > 750 kg/m² (massKgPerM2 800), 450 | klasse vloer zwaar → zeer zwaar |
| F | 2020+A1 | hsb, sfb of staalskelet met staalbeton of niet-massieve betonnen vloeren | 250–500 kg/m², 180 | nee |
| G | 2024 | massief beton (zeer zwaar) / dragend metselwerk (zwaar) | 450 | nee |
| H | 2023 | massief beton / hsb, sfb of staalskeletbouw; RZ-1 gesloten, RZ-2 open plafond | 110 en 180 | klasse vloer zwaar → zeer zwaar |
| J | 2020+A1 | dragend metselwerk met massieve betonnen vloeren | > 750 kg/m², 250 | klasse wand zeer zwaar → zwaar |
| K | 2022 | hsb, sfb of staalskelet met staalbeton of niet-massieve betonnen vloeren | 250–500 kg/m², 110 en 180 | nee |
| L | 2022 | betonnen kolom-ligger skeletbouw met niet-massieve betonnen vloeren, gesloten plafond | 500–750 kg/m², 180 | nee |

Waarom de aanpassingen bij D, E, H en J de uitkomst niet veranderen:
- Bij D en E beslist de massa per m² (2020+A1 en 2022, `massKgPerM2`). De klassen tellen daar niet mee.
- Bij H (2023) staan "zeer zwaar/licht" en "zwaar/licht" op dezelfde rij van tabel 7.10 (2023 p. 184).
- Bij J staan "zeer zwaar/zwaar" en "zeer zwaar/zeer zwaar" op dezelfde rij.

De klassen volgen nu letterlijk tabel 7.11 en 7.12 (2023 p. 185–186): massieve betonnen vloeren zijn zeer zwaar, dragend metselwerk is zwaar. Zo blijft de invoer goed als een geval in een latere editie wordt doorgerekend, waar de klassen wel beslissen.

**Overige invoer.** De rest van de invoer klopt met de uitdraaien:
- **Rc, U en g:** gelijk per constructie.
- **q_v;10:** de meetwaarde, of bij A en D de referentiewaarde zonder meetwaarde (0,69 en 0,98, zoals de uitdraai).
- **Ventilatie:** de variant en het rendement van de warmteterugwinning zijn gelijk.
- **Opwekker:** COP, energiefractie en hulpenergie zijn gelijk. Bij B staat 146 kWh voor woning 2; woning 1 en 4 drukken 153 kWh af.
- **Tapwater:** COP gelijk.
- **PV:** gelijk. Bij F rondt de kern bewust af: 190 W/m² × 44,64 m² in plaats van 24 × 360 Wp (zie F).
- **Gebruiksoppervlakten:** de oppervlakten per gebruiksfunctie, inclusief de naar rato verdeelde gemeenschappelijke ruimte van H, K en L.

Eén inconsistentie is gevonden. Het projectmodel van E had q_v10 0,40, terwijl de rekeninvoer en de uitdraai 0,63 hebben. Die waarde gaat niet naar de kern, wel naar de Uniec 3-export (`zones[].airTightness`). Het projectmodel heeft nu 0,63.

**Uitkomst.** Er is geen geval met een verkeerde rij of een andere invoerfout die de uitkomst raakt. De vastgelegde uitkomsten van alle gevallen zijn ongewijzigd (`public_comparison_cases_keep_their_recorded_results`, `openbare-gevallen.json`).

De RVO-voorbeeldwoningen noemen geen bouwwijze: de verantwoordingsrapportage 2022 geeft niets over massa of bouwwijze. Hun klassen blijven daarom een aanname, zoals in [de RVO-vergelijking](nta8800-vergelijking-rvo-voorbeeldwoningen.md) staat.
