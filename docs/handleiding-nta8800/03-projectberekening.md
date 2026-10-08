# 3. Projectberekening

Een projectberekening (detailopname of nieuwbouw) bestaat uit twee lagen:

1. **Het projectmodel**: zones, vlakken, ramen, constructies, koudebruggen, onverwarmde ruimten en installaties. Je bouwt het op onder de werkstappen *Gebouw* (tabel *Schil & ramen*, rekenzones, constructies, koudebruggen, luchtdichtheid, onverwarmde ruimten) en *Installaties*.
2. **Het NTA-invoerblok** (`ntaCalculation`): de NTA 8800-gegevens die het projectmodel nog niet heeft. Je begint het met **NTA-invoer starten** op de stap Project. De secties staan daarna onder de werkstappen waar ze horen, in het blok *NTA 8800-invoer* onder aan elke pagina.

Elke opgegeven waarde vraagt een bron, zoals een tekening, productblad, normtabel of opnamerapport. Een leeg veld wordt nooit stilzwijgend aangevuld. Het blijft een invoergat (zie [hoofdstuk 5](05-validatie.md)).

## Het projectmodel

| Element | Wat vastleggen | Normbasis |
|---|---|---|
| Zone | gebruiksoppervlakte A_g, volume, bouwlagen | §6.6 |
| Vlak | thermische begrenzing (buitenlucht, grond, onverwarmde ruimte, aangrenzend verwarmd, intern), oriëntatie, constructie | §6.7, §8.2 |
| Constructie | U-waarde, of R_c uit lagen via **Constructie bewerken**: het onderdeel *NTA 8800 U/R_c* rekent met de kern (bijlage C, forfaitair bijlage I). Een niet-geventileerde luchtspouw dunner dan 20 mm zonder reflecterende laag rekent de kern zelf (bijlage D.2 van NEN-EN-ISO 6946, voetnoten c en e van tabel C.3/C.4); een zwak geventileerde of reflecterende dunne spouw geef je op als R-waarde met bron | §8.2, bijlagen C en I |
| Raam | oppervlakte, U, g (loodrecht) | §7.6, §8.2 |
| Koudebrug | lineair (ψ, lengte) en puntvormig (χ), met begrenzing | §8.2 |
| Onverwarmde ruimte | reductiefactor b met bron, of afgeleid via de NTA-invoer. Ook te combineren met forfaitaire koudebruggen (zie [hieronder](#forfaitaire-koudebruggen-met-een-onverwarmde-ruimte)) | §8.4 (8.53–8.59) |
| PV-systeem | panelen of oppervlak, oriëntatie, helling | hoofdstuk 16 |

**Bewerken en verwijderen.**
- Elke rij in de envelopweergave heeft de knoppen **Bewerken** en **Verwijderen**; dubbelklikken opent de editor.
- Bewerken laat id's en volgorde gelijk.
- Verwijderen vraagt om bevestiging. Wat wegvalt, staat in de bevestiging, en de NTA-invoer verliest meteen de verwijzingen naar het verwijderde onderdeel:
  - zonegegevens;
  - dynamische ramen;
  - vloeren op grond;
  - dakhellingen;
  - de zones van installaties.
- Een constructie die nog in gebruik is, kan niet worden verwijderd.
- Een verwijdering die de paden van een handmatige maatwerkadviesmaatregel zou verschuiven, wordt geweigerd.

## Hulppanelen

Naast de NTA-invoer zijn er vier hulppanelen. Ze staan bij de stap waar ze inhoudelijk horen:
- *Invoercontrole*: Controle › Overzicht;
- *Onverwarmde ruimtes*: Gebouw › Onverwarmde ruimten;
- *NTA-warmtepompen* en de *gaswarmtepomp-referentievergelijking* (uitklapbaar): Installaties › Warmtepompen.

- **Invoercontrole.** Een structuurcontrole van het projectmodel door de rekenkern: fouten, aandachtspunten en de indeling van de warmtepompen. Het paneel toont ook de herkomst van de controle (doelnorm, kernelversie en invoervingerafdruk). Het is geen NTA 8800-berekening en geen energielabel.
- **Onverwarmde ruimtes.** Hier leg je per onverwarmde ruimte een reductiefactor b (0 t/m 1) met een bron vast. Een afgeleide b_U (8.53–8.59) geef je op via de NTA-invoer. Het paneel toont ook een diagnose van de transmissie via deze ruimtes (A·U, L·Ψ en χ met de opgegeven b); die diagnose is geen geverifieerde uitkomst.
- **NTA-warmtepompen.** Een lijst van losse warmtepompen met brontype en bediende zones. De invoercontrole classificeert ze, maar de energieberekening gebruikt ze niet: die rekent met de opwekkers uit het NTA-invoerformulier. Bij het verwijderen van een zone verdwijnt die zone uit de lijst van bediende zones.
- **Gaswarmtepomp-referentievergelijking.** Je laadt een case met 25 verwachte waarden (een synthetisch voorbeeld of een eigen JSON-bestand) en vergelijkt die met de conceptberekening voor gaswarmtepompen. Een overeenkomst bewijst geen NTA-conformiteit en levert geen BENG-uitkomst of label op.

## Het NTA-invoerformulier

Het formulier vraagt alleen wat het projectmodel nog niet heeft. De secties staan verdeeld over de werkstappen (zie [hoofdstuk 0](00-werken-met-het-programma.md#nta-invoer-in-de-stappen)); Controle › NTA-invoer toont de overige secties en het paneel *NTA 8800-berekening (Rust-kern)*. Wijzigingen gaan in één concept; **Toepassen** in de toepasbalk onderaan schrijft ze in het project, **Ongedaan maken** draait de laatste wijziging terug. Lege velden staan na het formulier in de melding **Nog leeg (n): …**. Ze gaan niet mee naar de rekenkern; een verplicht veld verschijnt na de berekening als invoergat.

| Onderdeel | Inhoud | Normbasis |
|---|---|---|
| Algemeen | rekenscope (woningbouw of utiliteit), bouwjaar, bron A_g, gebruiksfunctie en woningtype, Bbl-functie, actieve koeling (systeem, capaciteitsbewijs of bijlage AA, zie [hieronder](#koelvermogen-volgens-bijlage-aa)), vergunningaanvraag na 29 mei 2026, fossiele toestellen buiten de berekening | tabellen 7.13–7.15, §5.7.1, bijlage AA |
| Gebruiksfuncties met oppervlakte | functies voor gemengde rekenzones, Bbl-toets en labelklasse | §6.5.3, Bbl art. 4.149 lid 2 |
| Setpoints (tabel 7.13) | verwarmings- en koelsetpoint; het formulier toetst per zone aan tabel 7.13 (gewogen bij meerdere functies), knop "Tabelwaarden gebruiken" | tabel 7.13 |
| Thermische massa (tabel 7.10) | klasse vloer en wand, plafondkolom; alleen onder 2022 en 2020+A1 ook de massa per m² gebruiksoppervlakte (kg/m²) | tabellen 7.10–7.12 |
| Interne warmtewinst | aantal woningen; bij utiliteit de tabelmethode of een opgegeven W/m² | 7.21–7.29, tabellen 7.2/7.3 |
| Ramen (zonwinst) | kozijnfractie, belemmering, beweegbare zonwering (F_c, bediening) | §7.6, §17.3, 7.42/7.43 |
| Belemmering per raam (Gebouw › Schil & ramen) | per buitenraam "Zoals project" of een eigen situatie a–g of opgegeven factoren, met bron; een raam dat niet meer in het project staat, wordt gemeld met **Verwijderen** | 7.13, §17.3.2 |
| Zonwering per raam (Gebouw › Schil & ramen) | per buitenraam "Zoals project", "Geen" of een eigen beweegbare zonwering: de bediening (tabel 7.7–7.9), het type uit tabel 7.5/7.6 of een eigen F_c, en de bron; bijvoorbeeld screens op alleen het dakraam | 7.42, 7.43 |
| Glas per raam (Gebouw › Schil & ramen) | per buitenraam "zoals project" (de g-waarde van het raam), een glastype van tabel 7.4 en/of vaste lamellen (7.41a), of verstrooiende beglazing of vaste zonwering met g_gl,alt en g_gl,dif volgens ISO 15099 (7.41), met bron | 7.6.6.1.2, 7.6.6.1.3, 7.41 |
| Dynamische ramen (bijlage A) | per buitenraam methode A (toestanden met gewichten) of B, correctie stap 2 | bijlage A (p. 766–771) |
| Aangrenzende onverwarmde serres (7.30b) | serre en de vlakken ervan | 7.30b |
| Dakhellingen | helling per hellend dakvlak | tabel 17.2 |
| Vloeren op grond (§8.3) | blootgestelde omtrek, R_si + R_c, vloerrand (ψ of forfait), kruipruimte of onverwarmde kelder, verwarmde kelder, randisolatie; onder 2022 en 2020+A1 bij een kruipruimte of kelder ook de wandhoogte h boven maaiveld (8.47). Een verwarmde vloer die zelf onder maaiveld ligt en een kruipruimte of onverwarmde kelder onder zich heeft, geef je op als kruipruimte of kelder plus *verwarmde kelder* met de werkelijke diepte (zie [hieronder](#verwarmde-vloer-onder-maaiveld-boven-een-kruipruimte)) | §8.3, bijlage D |
| Verticale leidingen (7.3.3) | "geen", een lijst, of onbekend (geeft een gat) | §7.3.3 |
| Ventilatie | hoofdstuk 11 (systeem, WTW, kanalen, LBK, infiltratie, regelingen, passieve koeling), of "H_ve zelf opgeven". Bij het systeem kan een **gedeclareerde f_ctrl** uit een kwaliteitsverklaring of BCRG-gelijkwaardigheidsverklaring worden opgegeven, met de verklaring als bron; die vervangt de waarde van tabel 11.5 (niet bij het decentrale deel van E.1) | hoofdstuk 11, tabel 11.5 |
| Afgifte en distributie (§9.3/9.4) | afgiftesysteem, inregeling, regeling, ventilatoren in de afgifte, distributie berekend of forfaitair, luchtverwarmers. Staan er luchtverwarmers van meer dan één type in de zone (bijvoorbeeld axiale en radiale recirculatieventilatoren), dan telt de hulpenergie per type naar rato van het aantal (9.23): geef het aantal van het eerste type en de overige typen met hun aantal op. ψ van de leidingen kan uit de leidinggegevens worden berekend, ook voor leidingen in de constructie (9.34), met **ψ uit de leidinggegevens** (zie [hieronder](#leidinggegevens)) | §9.3, §9.4, 9.21–9.23, 9.26–9.51 |
| Opwekker | zie hieronder. Bij een gas- of olieketel kan de hulpenergie uit een kwaliteitsverklaring komen: vink **Hulpenergie uit een kwaliteitsverklaring (A, B, C en Bnom van 9.85)** aan. A en C worden naar beneden afgerond op één decimaal en B op drie; de term met B rekent met de brandstofinvoer van de ketel, gas of olie. Bij een WKK met methode 2 kunnen ε_chp;th en ε_chp;el uit een kwaliteitsverklaring de waarden van tabel 9.31 vervangen (**Omzettingsgetallen uit een kwaliteitsverklaring**), naar beneden afgerond op twee decimalen | §9.1, §9.6 |
| BCRG-verklaringstabel | losse controle van een BCRG-tabel; telt niet mee in de projectberekening | — |
| Extra verwarmingssystemen (§9.2) | bij meerdere zones: systemen per zone | §9.2 |
| Warm tapwater (§13) | functie en oppervlakte of aantal woningen, tappunten, leidingen, circulatie, voorraadvaten, toestel; onder 2022 en 2020+A1 ook "elektrische boiler met geïsoleerde leidingen" (f_sto;dis;ls). Bij een circulatieleiding kan ψ uit de leidinggegevens worden berekend (13.27–13.29), bijvoorbeeld voor een leiding in de constructie; de warmteovergangscoëfficiënt ligt daar vast op 8,0 W/(m²·K). Een WKK die ook tapwater levert, kan dezelfde omzettingsgetallen uit een kwaliteitsverklaring gebruiken als bij verwarming. Een boosterwarmtepomp kan forfaitair rekenen (13.162/13.163) met de ontwerpaanvoertemperatuur van het verwarmingssysteem dat hem voedt; zonder die temperatuur rekent de kern met de ongunstigste waarden | hoofdstuk 13 |
| Extra tapwatersystemen (§13.2.4) | meerdere systemen per gebouw | §13.2.4 |
| Zonneboilers (§13.7) | berekend of getest systeem, PVT | §13.7 |
| Zonneverwarming zonder tapwatersysteem | zonnecombi voor ruimteverwarming | §13.7 |
| Koeling (§10.5) | opwekker (methode 1, 2 of 3), afgifte, distributie; bij meerdere zones meerdere koelsystemen. Bij water als koudedrager kan ψ van de leidingen uit de leidinggegevens worden berekend (10.24–10.26) | hoofdstuk 10 |
| Bevochtiging (hoofdstuk 12) | per zone verneveling of stoom, eventueel bediend oppervlak | hoofdstuk 12 |
| Verlichting (hoofdstuk 14), alleen utiliteit | per verlichtingszone vermogen (forfait of armaturen), schakeling, daglicht, parasitair vermogen; onder 2022 en 2020+A1 ook constante-lichtregeling (tabel 14.4) | hoofdstuk 14 |
| PV (§16) | piekvermogen, belemmering per systeem | hoofdstuk 16, §17.3 |
| Bevestigingen | f_BACS met bron, BACS-blok, externe levering (bijlage P), alle posten en opwekking opgenomen, opgegeven stromen, C1-ventilatie, opslag | §5.5, §5.8, 5.14a, bijlage P |

### Opwekkers voor ruimteverwarming

Het formulier kent deze opwekkers:
- **Fossiel:** gasketel (forfait), ketel met productgegevens (bijlage M).
- **Elektrisch en warmtepomp:**
  - elektrische warmtepomp, forfaitair (tabellen 9.27/9.29);
  - warmtepomp met productgegevens (bijlage Q);
  - hybride warmtepomp;
  - gaswarmtepomp;
  - elektrische verwarming.
- **Overig:**
  - externe warmtelevering;
  - WKK (tabel 9.31 of methode 1);
  - biomassa;
  - lokale, lucht- of stralingsverwarmer (bijlage N);
  - overige verwarmer (tabel 9.25).
- **Meerdere opwekkers** (9.6.1), met voorkeursvolgorde en geschatte β.

Een warmtepomp volgens bijlage Q in een set bepaalt boven 55 °C zelf zijn aandeel (§9.6.3).

Onder de uitgave 2020+A1 vraagt de forfaitaire (of hybride) warmtepomp ook het **installatiejaar** met bron. Formule 9.85 van die uitgave neemt A = 13,0 kWh voor een toestel vanaf 2015 en 87,6 kWh voor een ouder of onbekend toestel. Onder de latere uitgaven heeft het jaar geen invloed en is het veld verborgen.

**Invoer die alleen in een uitgave bestaat.** Velden die een andere uitgave niet kent, staan alleen onder die uitgave in het formulier. Kies je een andere uitgave terwijl zo'n veld een waarde heeft, dan toont het formulier een melding met **Verwijderen**; de rekenkern weigert de waarde anders met `route_not_in_edition`. Zie [Normversies](10-normversies.md).

### Opgegeven productwaarden en hun bewijs

Waar het formulier een waarde uit een kwaliteitsverklaring toelaat (§9.1), vervangt die waarde het forfait of de tabelwaarde. Dat geldt onder meer voor:
- de gedeclareerde f_ctrl bij de ventilatie (tabel 11.5);
- A, B, C en B_nom van de ketelhulpenergie (9.85);
- ε_chp;th en ε_chp;el van een WKK (tabel 9.31), voor verwarming en tapwater;
- het opwekkingsrendement van een warmtepomp of tapwatertoestel;
- de belemmering, de zonwering en het glas per raam.

Elke opgegeven waarde vraagt een bron: nummer en uitgever van de verklaring, of de tekening, het productblad of de opname. Leg het bestand zelf vast in het bewijsregister en koppel het aan het veld met **Bron & bewijs** (zie [hoofdstuk 7](07-herlabelen-registratie-dossier.md#bewijsregister)); het projectdossier bevat dan de gebruikte verklaringen (BRL 9500 bijlage 3). Zonder bron geeft de kern een invoergat en gebruikt hij de opgegeven waarde niet.

### Leidinggegevens

Bij distributie (verwarming en koeling) en bij de circulatieleiding van warm tapwater kun je ψ berekenen in plaats van opgeven. Kies onder **ψ uit de leidinggegevens** de soort leiding (*geïsoleerd, in lucht*, *geïsoleerd, in de constructie* of *ongeïsoleerd*) en vul de diameters, de λ-waarden en, bij een leiding in de constructie, de diepte in. Bij koeling kies je daarvoor *berekend uit de leidinggegevens (10.24–10.26)*.
- Alle maten zijn in **meters**: 15 mm is 0,015 m. Een diameter of diepte boven 1 m wordt geweigerd met *Leidinggegevens: een diameter of diepte is groter dan 1 m …*.
- Bij verwarming (9.33–9.35) en koeling (10.24–10.26) mag een eigen warmteovergangscoëfficiënt worden opgegeven; bij tapwater ligt die vast op 8,0 W/(m²·K) (13.27/13.29).
- Bij tapwater geef je ψ óf op óf bereken je hem, niet allebei.

### Forfaitaire koudebruggen met een onverwarmde ruimte

Rekent het gebouw met forfaitaire koudebruggen (ΔU_for) en grenst een rekenzone aan een onverwarmde ruimte, dan volgt de kern 8.4.1 opmerking 5 met bijlage C.10:
- de onverwarmde ruimte telt als buitenlucht, dus H_U;for = 0;
- de scheidingsconstructie tussen rekenzone en onverwarmde ruimte telt in H_D;for, met haar U-waarde maal b_U en dezelfde ΔU_for als de andere constructies;
- voor TOjuli telt ze op haar eigen oriëntatie, zonder zoninstraling.

b_U volgt uit de gegevens van de onverwarmde ruimte (8.53–8.59) of uit de opgegeven reductiefactor. Kan de kern hem niet afleiden, dan meldt hij *Transmissie via onverwarmde ruimte niet af te leiden*.

### Verwarmde vloer onder maaiveld boven een kruipruimte

Ligt een verwarmde vloer zelf onder maaiveld, met een kruipruimte of onverwarmde kelder eronder, dan geef je bij **Vloeren op grond** beide op: de kruipruimte of kelder, en *verwarmde kelder* met de werkelijke diepte z. De kern rekent:
- de vloer volgens 8.39 met U_fl van 8.43 en U_x;T = 0, omdat de vloer al onder maaiveld ligt;
- de wanden onder maaiveld met z·P·U_bw (8.45);
- de periodieke coëfficiënten in twee delen: de vloer met D.13/D.14 (kruipruimte) of D.15/D.16 (kelder), de wanden met de wandtermen van D.10/D.11. Bijlage D heeft voor deze combinatie geen eigen formule; de splitsing volgt de opbouw van 8.39 en opmerking 3 van 8.3.2. Zie [`nta8800-maandbehoefte.md`](../nta8800-maandbehoefte.md).

Onder 2022 is de wandhoogte h (8.47) voor zo'n vloer niet nodig; vanaf 2023 wordt een opgegeven h geweigerd. Randisolatie op zo'n vloer weigert de kern.

### Externe levering (bijlage P)

Per drager (warmte, warm tapwater, koude) kies je een route:
- forfaitair;
- kwaliteitsverklaring;
- gemeten stromen (P.6);
- berekend systeem (P.7, P.9), met leidingdelen, opslag, opwekkers met prioriteit en hulpenergie.

### Koelvermogen volgens bijlage AA

Kies bij **Actieve koeling** als capaciteitsbewijs *bijlage AA (berekening per ruimte)*. Je vindt deze sectie onder Installaties › Koeling. Kies dan **Berekening bijlage AA toevoegen**. Het formulier vraagt het volgende:
- **Gegevens van de rekenzone:**
  - het bouwjaar voor tabel AA.2;
  - of meer dan 50 % van A_in aantoonbaar na-geïsoleerd is;
  - het vermogen van een centrale koelopwekker B_C;inst;zi. Laat dit veld leeg als elke ruimte een eigen opwekker heeft (AA.3.2.3).
- **Per verblijfsruimte:**
  - naam;
  - vloeroppervlakte (m²);
  - dicht buitenoppervlak van gevel en dak, op binnenmaat (m²);
  - geïnstalleerd koelvermogen B_C;inst;zi,j (kW);
  - of het een woonkamer, keuken of eetkamer is. Zulke ruimten hebben een dubbele interne last.
- **Per ruimte de ramen.** Je kiest uit de buitenramen van het projectmodel. Een raam kan maar bij één ruimte horen, dus de keuzelijst toont alleen ramen die nog vrij zijn. U_w+shut (8.22) vul je alleen in als er zonwering volgens 7.6.6.1.4 is. Een leeg veld gebruikt de U_w van het raam. Een raam dat niet (meer) in het project staat, blijft zichtbaar met de aanduiding *niet in het project*.

**Ruimten beheren.** Een overzichtstabel boven de ruimten toont per ruimte de oppervlakte, het vermogen en het aantal ramen. Onder de tabel staan de totalen.
- **Ruimte toevoegen** maakt een lege ruimte.
- **Dupliceren** maakt een kopie met een nieuwe naam. De ramen gaan niet mee, omdat de rekenkern een raam bij twee ruimten weigert.
- **Ruimte verwijderen** haalt de ruimte weg.

**Controle.** Het formulier controleert dezelfde punten als de rekenkern, met dezelfde meldcodes. Het toont een melding direct bij het veld: een ontbrekende oppervlakte, een negatief vermogen, een onbekend of dubbel toegekend raam, of een dubbele ruimtenaam. De toets AA.10–AA.13 zelf doet de rekenkern na **Toepassen**.

**Meer rekenzones.** Bijlage AA wordt per gekoelde rekenzone bepaald. Heeft het project meer dan één rekenzone, dan toont het formulier per zone een eigen berekening, met **Berekening bijlage AA voor … toevoegen**. Elke zone biedt alleen haar eigen buitenramen aan. Staat er nog een berekening zonder zone (bijvoorbeeld van voordat het project werd opgesplitst), dan kies je met **Toewijzen aan …** bij welke zone die hoort. Een gekoelde zone zonder eigen berekening krijgt de melding dat het capaciteitsbewijs ontbreekt.

**Edities.**
- Onder de editie 2024 vraagt het formulier ook de specifiek werkzame massa SWM (50–100 kg/m²) en het dakoppervlak per ruimte.
- De edities 2023, 2022 en 2020+A1 kennen bijlage AA niet als capaciteitsbewijs. Het formulier meldt dat.

**JSON bekijken** toont de berekening als bewerkbare JSON. **JSON overnemen** neemt de JSON alleen over als die geldig is.

### Geavanceerd (JSON)

Het paneel toont het volledige NTA-invoerblok als JSON. Gebruik dit alleen als expertoptie, bijvoorbeeld voor verlichting per rekenzone in projecten met meerdere zones. Het formulier blijft de aanbevolen weg.

## Ontbrekende en tegenstrijdige invoer

| Melding | Betekenis | Oplossing |
|---|---|---|
| `nta_value_missing` | een getal in het invoerblok is leeg; het pad staat erbij | vul het veld in of verwijder het onderdeel |
| `setpoints_table_7_13_mismatch` | setpoints wijken af van tabel 7.13 | knop "Tabelwaarden gebruiken" |
| `vertical_pipes_unknown` | verticale leidingen niet opgegeven | kies "geen" of geef de leidingen op |
| `thermal_bridge_methods_mixed` | forfaitaire en gedetailleerde koudebruggen gemengd (§8.2.1) | kies één methode voor het hele gebouw |
| `window_dynamic_and_shading_exclusive` | dynamisch raam én beweegbare zonwering (§A.2) | neem de zonwering op in de toestanden van bijlage A |
| `rest_set_power_partial` | in een set met een bijlage Q-warmtepomp zijn niet alle restvermogens ingevuld | vul alle restvermogens in of maak ze allemaal leeg |
| `flow_reduction_evidence_required` | een gunstiger debietreductie dan het forfait zonder bewijs (11.60/11.61) | geef de bron op |
| `window_obstruction_without_window`, `window_shading_without_window`, `window_glazing_without_window` | een regel in *Belemmering*, *Zonwering* of *Glas per raam* noemt een raam dat niet meer bestaat | verwijder de regel |
| `window_obstruction_not_outdoor`, `window_shading_not_outdoor`, `window_glazing_not_outdoor` | het raam ligt niet meer in een vlak aan buitenlucht | verwijder de regel of zet het vlak terug op buitenlucht |
| `window_obstruction_reference_required`, `window_shading_reference_required`, `window_glazing_reference_required`, `source_reference_required` | een opgegeven waarde zonder bron | vul de bron in; tot dan rekent het raam met de projectwaarde |
| `window_g_declared_and_table` | een eigen g-waarde én een glastype uit tabel 7.4 | kies één van beide |
| `declared_control_factor_invalid`, `declared_control_factor_not_applicable` | gedeclareerde f_ctrl buiten (0, 2], of bij het decentrale deel van E.1 | waarde uit de verklaring overnemen; bij E.1 opgeven bij het overige systeem |
| `auxiliary_constant_invalid`, `boiler_auxiliary_declared_and_measured` | ketelhulpenergie: A, B of C buiten bereik, of zowel verklaring als metingen van bijlage O | waarden controleren; één route kiezen |
| `chp_declared_efficiency_invalid`, `chp_declared_efficiency_method1` | WKK: omzettingsgetallen niet groter dan 0 of samen boven 1, of opgegeven bij methode 1 | waarden controleren; methode 2 kiezen |
| `pipe_dimension_not_in_metres`, `hot_water_pipe_surface_coefficient_fixed`, `hot_water_psi_declared_and_calculated` | leidinggegevens in millimeters, een eigen h_a bij tapwater, of ψ zowel opgegeven als berekend | maten in meters; h_a leeg laten; één route kiezen |
| `booster_supply_temperature_invalid` | boosterwarmtepomp: aanvoertemperatuur niet groter dan 0 of boven 100 °C | temperatuur corrigeren of leeg laten |
| `air_heater_count_invalid` | aantal luchtverwarmers kleiner dan 1 | aantal per type invullen |
| `manufacture_year_invalid` | fabricagejaar van ventilator of WTW buiten 1900–2100 | jaar corrigeren, of leeg laten als het onbekend is |
| `unheated_transmission_unresolved` | transmissie via een onverwarmde ruimte is niet af te leiden | reductiefactor of de gegevens van de ruimte invullen |
| `air_cavity_below_20_mm_unsupported` | dunne luchtspouw die zwak geventileerd is of een reflecterende laag heeft | opgeven als R-waarde met bron |
