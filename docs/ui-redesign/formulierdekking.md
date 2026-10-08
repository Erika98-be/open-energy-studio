# Formulierdekking van de kerninvoer

Stand 9 oktober 2026. Elke keuze die de rekenkern kent, moet de gebruiker in een formulier kunnen maken, niet alleen in **Geavanceerd (JSON)**. Een certificeerbaar programma (BRL 9501 §3.0, de handleiding bij §4.4) laat de adviseur geen JSON schrijven voor gewone invoer. Dit document legt vast welke invoer een formulier heeft, en welke bewust alleen via JSON gaat, met de reden.

## Hoe de dekking wordt bewaakt

- **De catalogus.** `training-data/nta8800-input-options.json` bevat elke keuzewaarde (enum-variant) en elk optioneel veld van de projectinvoer (`ntaCalculation` en het projectmodel) en van beide basisopnamen. Serde levert de lijst, niet een handlijst: de test `input_option_catalogue_is_current` in `crates/nta8800-core/tests/option_coverage.rs` leidt hem af met dezelfde probe als de optiedekking. Komt er in de kern een variant of veld bij, dan faalt die test tot de catalogus is bijgewerkt (`UPDATE_INPUT_OPTIONS=1`).
- **De formuliercheck.** `src/__tests__/nta-form-coverage.test.ts` telt een optie als gedekt wanneer haar naam als letterlijke waarde, objectsleutel of eigenschap voorkomt in de formuliercode (`FORM_SOURCES` in `src/core/nta/formCoverage.ts`). Een optie die zo niet te vinden is, moet in `FORM_COVERAGE_EXEMPTIONS` staan met de reden. Een vrijstelling die inmiddels wel een formulier heeft, laat de test ook falen, zodat de lijst niet veroudert.
- **Grens van de check.** De check zoekt op naam, niet op pad. Een veld met een algemene naam (`sourceReference`, `areaM2`) telt als gedekt zodra die naam ergens in een formulier staat. De check vangt dus nieuwe, ontbrekende keuzes, maar bewijst niet dat elke plek in elke zone een eigen veld heeft. Velden per rekenzone in `zoneData` (behalve setpoints en verticale leidingen) gaan in de praktijk via de projectbrede blokken.

## Dekking

| | Voor deze ronde | Na deze ronde |
|---|---|---|
| Projectinvoer, varianten | 569 / 586 | 583 / 586 |
| Projectinvoer, velden | 476 / 512 | 499 / 512 |
| Woningopname, varianten | 148 / 176 | 176 / 176 |
| Woningopname, velden | 120 / 140 | 140 / 140 |
| Utiliteitsopname, varianten | 154 / 194 | 194 / 194 |
| Utiliteitsopname, velden | 184 / 215 | 215 / 215 |
| **Totaal op naam gevonden** | **1 651 / 1 823 (90,6 %)** | **1 807 / 1 823 (99,1 %)** |

De 16 overige opties staan in de vrijstellingen hieronder: 2 hebben wel een formulier (de check ziet ze niet), 14 zijn bewust alleen JSON.

## Waar de invoer staat

| Invoer | Formulier |
|---|---|
| Functie, berekeningsgebied, woningtype (`labelFunction`, `bblFunction`, `usageFunction`, `calculationScope`, `dwellingType`) | Stap Project en Gebouw |
| Schil: vloeren op grond, hellingen, belemmering, zonwering en glas per raam, massa, interne warmte, setpoints | Gebouw › Schil & ramen, Gebouw › Zones |
| Verwarming: opwekker (rol van de ketel, bronsysteem van de warmtepomp), afgifte | Installaties › Verwarming |
| Distributie: pomp (EEI, ontwerpvolumestroom, eenpijpsysteem, vermogen, L_max), buffervat, combinatieleidingen, afleverset, b_U | Installaties › Verwarming › Distributie |
| Tapwater: alle opwekkers (ook boosterwarmtepomp bijlage W, warmtepompen in serie, warmtepomp met indirect vat, biomassa-combitoestel, groot direct gestookt vat), afleversets, b_U | Installaties › Tapwater |
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

**Wel een formulier, niet op naam te vinden:** de kleur van een zonweringstoestel (`dark`, `white`). Zonwering per raam en de projectbrede zonwering kiezen het toestel als één samengestelde waarde "soort:kleur".

## Nieuwe formulieren in deze ronde

- **Tapwater:** boosterwarmtepomp met meetwaarden (bijlage W: beproevingen bij 24 en 40 °C, klasse, stilstandsverlies W.17, brontemperatuur als één waarde of per maand, bron van de warmte), warmtepompen in serie (bron van de laatste warmtepomp), warmtepomp met indirect verwarmd vat, biomassa-combitoestel (isolatie volgens bijlage R), overig direct gestookt voorraadtoestel; afleversets en b_U per tapwatersysteem.
- **Verwarming:** rol van de ketel (ook individuele bijverwarming), bronsysteem van de warmtepomp (9.62); in de distributie de pompgegevens, het buffervat, combinatieleidingen, de afleverset en b_U.
- **Koeling:** leidinglengte en temperatuur buiten de gekoelde zone, en de circulatiepomp (10.4.2.3).
- **Ventilatie:** vermogen van een ventilator uit het motorvermogen (11.135, tabel 11.20) en het oppervlak van de hele woning bij een woning in meer zones.
- **Interne warmte en verticale leidingen:** aandeel woningen in de zone (6.2b) en het aandeel gebruiksoppervlak per leiding.
- **Basisopname:** zie de tabel hierboven; daarnaast de volledige glaslijst van ISSO 82.1 tabel 7.8 / 75.1 tabel 7.9.

De formulieren schrijven precies de vorm van de kern; `src/__tests__/nta-form-coverage-forms.test.tsx` controleert dat per formulier (formulier → kern-JSON) en dat de invoergaten van de nieuwe velden naar de juiste stap leiden.
