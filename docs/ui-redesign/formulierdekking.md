# Formulierdekking van de kerninvoer

Stand 9 oktober 2026. Elke keuze die de rekenkern kent, moet de gebruiker in een formulier kunnen maken, niet alleen in **Geavanceerd (JSON)**. Een certificeerbaar programma (BRL 9501 §3.0, de handleiding bij §4.4) laat de adviseur geen JSON schrijven voor gewone invoer. Dit document legt vast welke invoer een formulier heeft, en welke bewust alleen via JSON gaat, met de reden.

## Hoe de dekking wordt bewaakt

- **De catalogus.** `training-data/nta8800-input-options.json` bevat elke keuzewaarde (enum-variant) en elk optioneel veld van de projectinvoer (`ntaCalculation` en het projectmodel) en van beide basisopnamen. Serde levert de lijst, niet een handlijst: de test `input_option_catalogue_is_current` in `crates/nta8800-core/tests/option_coverage.rs` leidt hem af met dezelfde probe als de optiedekking. Komt er in de kern een variant of veld bij, dan faalt die test tot de catalogus is bijgewerkt (`UPDATE_INPUT_OPTIONS=1`).
- **De formuliercheck.** `src/__tests__/nta-form-coverage.test.ts` telt een optie alleen als gedekt wanneer de formulieren van **haar eigen route** haar **schrijven** (`FORM_SOURCES` in `src/core/nta/formCoverage.ts`, per route: project, woningopname, utiliteitsopname):
  - de naam staat op een schrijfplek: een keuzewaarde, een padelement of een sjabloonsleutel. Een lezing (`read(`), een vergelijking (`=== 'x'`, `case 'x'`) of commentaar telt niet; commentaar wordt eerst verwijderd;
  - bij een veld staat de ouder-sleutel bij die schrijfplek: binnen een paar regels, of in de definitie van de padvariabele (`const base = ['envelope', 'doors', index]`), of de component krijgt die padvariabele van zijn aanroeper. Zo dekt het `glass` van een raam niet het `glass` van een deur in hetzelfde bestand;
  - weergavepagina's (de shell) tellen niet mee; alleen het projectinfo-venster en de gebouwpagina staan erin. Het warmtepomppaneel staat erin omdat het de forfaitaire warmtepomp van het project invult (`FORM_BUILDERS`: het bouwt het hele object in één keer).

  Een optie die zo niet gedekt is, staat in `FORM_COVERAGE_EXEMPTIONS` met de reden en een soort: `form` (wel een formulier, niet op naam te zien), `json` (bewust alleen JSON), `missing` (nog geen formulier, te bouwen) of `parallel` (formulier in een parallelle wijziging). Een vrijstelling die inmiddels wel gedekt is, laat de test falen, zodat de lijst niet veroudert.
- **Grens van de check.** Het blijft tekstanalyse, geen render-test per veld. Wat de check als gedekt telt, schrijft wel echt die naam onder die ouder; of het veld op elke plek (elke zone, elk systeem) staat, toetsen de formuliertests (`nta-form-coverage-forms.test.tsx`).

## Dekking

Tot 9 oktober 2026 telde de check een optie als gedekt zodra haar naam ergens in een formulierbestand stond, ook in een lezing, commentaar of een formulier van een andere route. Dat gaf 1 807 / 1 823 (99,1 %), te hoog: de zevende review vond opties die geen formulier aanbiedt (onder meer het glas van een deur, onverwarmde ruimten in de opname, en `bblFunction`-waarden die alleen in de lijst voor meerdere functies stonden). Met de strengere check:

| Route | Opties | Door een formulier geschreven | Vrijstelling `form` | `json` | `missing` | `parallel` |
|---|---|---|---|---|---|---|
| Projectinvoer | 1 098 | 1 061 | 8 | 16 | 13 | 0 |
| Woningopname | 316 | 288 | 0 | 0 | 25 | 3 |
| Utiliteitsopname | 409 | 379 | 0 | 0 | 29 | 1 |
| **Totaal** | **1 823** | **1 728 (94,8 %)** | **8** | **16** | **67** | **4** |

Met de vrijstellingen van soort `form` erbij heeft **1 736 / 1 823 (95,2 %)** een formulier. 16 opties zijn bewust alleen JSON. 67 opties hebben nog geen formulier (`missing`): vooral velden per rekenzone in `zoneData`, onderdelen van een verder tapwatersysteem en opnamevragen naar schildelen, PV en tapwater (lijst in `formCoverage.ts`). 4 krijgen een formulier in de parallelle opnamewijziging (glas van een deur, onverwarmde ruimten).

In deze ronde kregen een formulier: de douche-WTW (§13.5.3, per douche met verbinding en opgegeven rendement), de kokendwaterkraan, het gasgestookte voorraadtoestel (13.165–13.175), de ontbrekende Bbl-functies (woonwagen, drijvende bouwwerken, logies in een logiesgebouw) en de berekende Ψ van de verwarmingsleidingen (9.33–9.35).

## Waar de invoer staat

| Invoer | Formulier |
|---|---|
| Functie, berekeningsgebied, woningtype (`labelFunction`, `bblFunction`, `usageFunction`, `calculationScope`, `dwellingType`) | Stap Project en Gebouw |
| Schil: vloeren op grond, hellingen, belemmering, zonwering en glas per raam, massa, interne warmte, setpoints | Gebouw › Schil & ramen, Gebouw › Zones |
| Verwarming: opwekker (rol van de ketel, bronsysteem van de warmtepomp), afgifte | Installaties › Verwarming |
| Distributie: Ψ forfaitair of berekend uit de leidinggegevens (9.33–9.35), pomp (EEI, ontwerpvolumestroom, eenpijpsysteem, vermogen, L_max), combinatieleidingen, b_U; bij een collectieve installatie de afleverset, en met een berekende Ψ ook het buffervat (tabel 9.16 opmerking 2) | Installaties › Verwarming › Distributie |
| Tapwater: alle opwekkers (ook boosterwarmtepomp bijlage W, warmtepompen in serie, warmtepomp met indirect vat, biomassa-combitoestel, groot direct gestookt vat, gasgestookt voorraadtoestel), kokendwaterkraan, douche-WTW, afleversets, b_U | Installaties › Tapwater |
| Koeling: opwekkers, afgifte, distributie met leidinglengte buiten de gekoelde zone en de circulatiepomp | Installaties › Koeling |
| Ventilatie: systeem, ventilatoren (opgegeven of motorvermogen), woningoppervlak bij meer zones | Installaties › Ventilatie |
| Verlichting, PV, GBS, opgegeven gebruik, hernieuwbaar | Installaties › Verlichting, Opwekking, Overig |
| Woningopname: woningtype, ligging, daktype, constructie en plafond, gemeten q_v10, ventilatieprincipe en unit, ruimteregeling, leidingen in onverwarmde ruimten, douches en tappunten, deuren, glas (alle soorten van tabel 7.8), rietdak, kruipruimtebodem, onverwarmde ruimte als grens | Basisopname (woning) |
| Utiliteitsopname: gebouwtype, verlichtingszones (armaturen of lampen, lamptype, aanwezigheid, daglicht), recirculatie, volumestroomregeling, LUKA-kanalen, LBK-kanalen, bevochtiging, GBS, collectieve verwarming, zonwerend glas, koelleidingisolatie | Basisopname (utiliteit) |

## Bewust alleen via JSON

| Invoer | Reden |
|---|---|
| `ntaCalculation.internalGains.lighting.method: resolved` | Interne waarde: de kern vult Φ_int;L zelf in uit hoofdstuk 14; geen invoerkeuze. |
| `lighting[].burningHoursFactor` | Alleen voor maatwerkadvies (ISSO 75.2 tabel 2.7); het maatwerkadvies zet hem, nooit voor het energielabel. |
| `ventilation.practice` (ook per zone) | Alleen voor maatwerkadvies (praktijkfactoren ISSO 82.2/75.2); het maatwerkadvies zet hem. |
| `ventilation.overventilation` (ook per zone) | Maandwaarden die de kern uit de warmtepompketen afleidt; alleen opgeven bij afwijkende meetgegevens. |
| `ventilationFlows[].months[].coolingConductanceWPerK`, `coolingSupplyTemperatureC` | Afwijkende koelwaarden per maand van een opgegeven luchtstroom; leeg is de verwarmingswaarde. |
| `thermalMass.annexBElements` (ook per zone) | Bijlage B per bouwdeel vervangt tabel 7.10 en vraagt een lagenopbouw per element. |
| `generator.auxiliaryMeasurements` | Componentmetingen volgens bijlage O (9.86–9.90) uit een meetrapport. De opgegeven A/B/C uit een kwaliteitsverklaring hebben wel een formulier. |
| `hotWater.generator.annexT`, `annexTConditions` | Beproevingsrapport volgens bijlage T (gaskeur-koppeling); zeldzaam, uit het rapport over te nemen. |
| `distributionSystem.unheatedPipeTransmittance` | Afwijkende Ψ voor het deel in onverwarmde ruimten; leeg geldt de Ψ van het hele systeem. |

**Wel een formulier, niet op naam te vinden:** het soort en de kleur van een zonweringstoestel. Zonwering per raam en de projectbrede zonwering kiezen het toestel als één samengestelde waarde "soort:kleur". `distributionSystem.usageFunction` neemt het sjabloon over van het blok.

**Bewust JSON, nieuw in de lijst:** de maandwaarden van de warmte die een boosterwarmtepomp aan de koeling onttrekt, en de maandfracties van de ventilatorregeling; beide uit een meetrapport.

## Nieuwe formulieren in deze ronde

- **Tapwater:** boosterwarmtepomp met meetwaarden (bijlage W: beproevingen bij 24 en 40 °C, klasse, stilstandsverlies W.17, brontemperatuur als één waarde of per maand, bron van de warmte), warmtepompen in serie (bron van de laatste warmtepomp), warmtepomp met indirect verwarmd vat, biomassa-combitoestel (isolatie volgens bijlage R), overig direct gestookt voorraadtoestel; afleversets en b_U per tapwatersysteem.
- **Verwarming:** rol van de ketel (ook individuele bijverwarming), bronsysteem van de warmtepomp (9.62); in de distributie de pompgegevens, het buffervat, combinatieleidingen, de afleverset en b_U.
- **Koeling:** leidinglengte en temperatuur buiten de gekoelde zone, en de circulatiepomp (10.4.2.3).
- **Ventilatie:** vermogen van een ventilator uit het motorvermogen (11.135, tabel 11.20) en het oppervlak van de hele woning bij een woning in meer zones.
- **Interne warmte en verticale leidingen:** aandeel woningen in de zone (6.2b) en het aandeel gebruiksoppervlak per leiding.
- **Basisopname:** zie de tabel hierboven; daarnaast de volledige glaslijst van ISSO 82.1 tabel 7.8 / 75.1 tabel 7.9.

De formulieren schrijven precies de vorm van de kern; `src/__tests__/nta-form-coverage-forms.test.tsx` controleert dat per formulier (formulier → kern-JSON) en dat de invoergaten van de nieuwe velden naar de juiste stap leiden.
