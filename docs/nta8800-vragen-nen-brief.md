# Brief aan NEN en RVO: interpretatievragen NTA 8800

*Verzendklaar concept, opgesteld 10 oktober 2026 uit [nta8800-vragen-nen.md](nta8800-vragen-nen.md). Vul de velden tussen rechte haken in voor verzending. De brief citeert geen normtekst; hij verwijst alleen naar formule-, paragraaf- en paginanummers van NTA 8800:2025+C1:2026, tenzij een andere uitgave is genoemd.*

---

[organisatie]
[adres]
[postcode en plaats]

Aan: NEN, normcommissie NTA 8800 (energieprestatie van gebouwen)
Afschrift: Rijksdienst voor Ondernemend Nederland (RVO), team EP-Online / energielabel

Datum: [datum]
Contactpersoon: [contactpersoon], [e-mailadres], [telefoonnummer]
Betreft: interpretatievragen bij NTA 8800 in verband met een aanvraag van een BRL 9501-attest

Geachte leden van de normcommissie,

[organisatie] ontwikkelt Open Energy Studio, rekensoftware voor de energieprestatie van woningen en utiliteitsgebouwen volgens NTA 8800. Wij bereiden de aanvraag van een attest volgens BRL 9501 voor. De versie waar deze vragen over gaan is programmaversie 0.2.0 met rekenkern 0.4.0 (nog niet uitgebracht); de standaarduitgave is NTA 8800:2025+C1:2026.

Bij het narekenen van openbare BENG-berekeningen van geattesteerde software zijn wij zes punten tegengekomen waar de tekst van de norm (of, bij vraag 4, de Omgevingsregeling) meer dan één lezing toelaat. Bij vier daarvan verklaart het verschil in lezing een meetbaar verschil in BENG 2 tussen onze uitkomst en het gepubliceerde rapport. Wij volgen nu steeds de letterlijke tekst, maar willen voor de attestering zeker weten welke lezing bedoeld is. Per vraag noemen wij de plaats in de norm, de twee lezingen, het gevolg in een openbaar geval en de concrete vraag. De openbare gevallen en de verschilanalyse per post staan in onze vergelijking van openbare rapporten; die sturen wij desgewenst mee.

Wij stellen een antwoord per vraag zeer op prijs, ook als het een verwijzing is naar een bestaande toelichting of een geplande correctie.

### Vraag 1. Afgifteverlies van koeling, formule 10.15 (p. 376)

- **Plaats.** Formule 10.15 (p. 376), met Δθ_int,inc uit tabel 10.35 en tabel 10.5. De formule is ongewijzigd sinds NTA 8800:2020 (p. 353).
- **Lezing A (letterlijk).** Het verlies is de koudeafgifte maal het grootste van de verhouding Δθ_int,inc / (θ_int,inc − θ_e,comb) en 0,15. Ligt θ_e,comb maar net boven θ_int,inc, zoals in mei en september, dan wordt de verhouding onbegrensd groot en het verlies groter dan de koudebehoefte zelf.
- **Lezing B.** Er is een bovengrens bedoeld, bijvoorbeeld een minimum in plaats van een maximum met 0,15, of een maximum van het verlies als fractie van de behoefte.
- **Gevolg in openbare gevallen.** De gepubliceerde rapporten impliceren een verlies van 16–42 % van de behoefte, dicht bij 0,15. Met lezing A ligt BENG 2 hoger dan in het rapport, in kWh/(m²·jr):
  - geval A +8,55, geval B +1,83 en geval C +1,46;
  - geval I +4,61;
  - geval M +18,26 (een woning van 43 m²; BENG 2 komt daarmee boven de eis van 30, het rapport blijft eronder).
- **Vraag.** Is het de bedoeling dat het verlies onbegrensd groot kan worden als θ_e,comb maar net boven θ_int,inc ligt? Zo nee: welke begrenzing is bedoeld, en hoe moet die worden toegepast?

### Vraag 2. Regelenergie van koeling, formule 10.87 (p. 425)

- **Plaats.** Formule 10.87 (p. 425): een regelvermogen van 0,010 kW dat volgens de tekst altijd in bedrijf is, samen 87,6 kWh per jaar per koelopwekker. Dezelfde tekst staat in NTA 8800:2020 (p. 403).
- **Lezing A (letterlijk).** De regelenergie telt in alle twaalf maanden, ook buiten het koelseizoen en ook bij een omkeerbare warmtepomp die in de zomer koelt.
- **Lezing B.** De regelenergie telt alleen in maanden met koudebehoefte, of niet als de regeling van een omkeerbare warmtepomp al in de hulpenergie voor verwarming zit. De gepubliceerde rapporten tonen voor de hulpenergie van koeling alleen pompenergie, circa 10 kWh per jaar.
- **Gevolg in openbare gevallen.** Met lezing A ligt BENG 2 hoger dan in het rapport, in kWh/(m²·jr):
  - geval A +1,66, geval B +0,94 en geval C +0,50;
  - geval I +0,29;
  - geval M +2,92.
- **Vraag.** Geldt de regelenergie van 10.87 in alle maanden? Geldt ze ook wanneer de koeling wordt geleverd door een omkeerbare warmtepomp waarvan de regeling al in de verwarmingsberekening is meegenomen?

### Vraag 3. Praktijkfactor f_prac bij een kwaliteitsverklaring van een warmtepomp (p. 337, 340, 615–617)

- **Plaats.** Formule 9.62 (tabelroute, f_prac 1) en 9.63 (gegevens volgens bijlage Q, f_prac 0,95); §9.1 (p. 285) over de kwaliteitsverklaring die de tabelwaarde vervangt; p. 615 over de kwaliteitsverklaring voor verwarming volgens bijlage Q; formule 13.152 voor tapwater.
- **Lezing A (onze keuze).** Een gedeclareerde COP voor verwarming valt onder 9.63 met f_prac 0,95. Een gedeclareerd tapwaterrendement is geen forfaitaire waarde en krijgt eveneens 0,95.
- **Lezing B.** Een gedeclareerde waarde die de tabelwaarde vervangt, blijft binnen 9.62 en 13.8.4.7, met f_prac 1.
- **Gevolg in openbare gevallen.** Lezing A komt tot op de kWh overeen met de gepubliceerde rapporten. Lezing B zou BENG 2 verlagen ten opzichte van die rapporten, in geval A met 2,82 en in geval B met 1,73 kWh/(m²·jr).
- **Vraag.** Klopt lezing A?

### Vraag 4. A0 en labelelement h bij een woning (Omgevingsregeling art. 5.11 en 5.13a)

Deze vraag gaat over de Omgevingsregeling (BWBR0045528, versie 2026-10-01), niet over NTA 8800. Wij leggen haar aan RVO voor, met het verzoek haar zo nodig door te zetten naar het ministerie.

- **A0, voorwaarde b.** Art. 5.11 lid 4 laat het primair fossiel energiegebruik van een woning bij energiemaatregelen op gebiedsniveau rekenen met forfaitaire waarden (EMGforf). Lid 5 onder b toetst het primair fossiel energiegebruik aan bijlage IXa.
  - **Lezing A (onze keuze).** Lid 5 onder b toetst dezelfde waarde als lid 4, dus de labelwaarde met EMGforf. Een woning met een warmtenet met kwaliteitsverklaring kan zo BENG 2 ≤ 27 hebben en toch geen A0 krijgen. Voor utiliteit (art. 5.12 lid 4) is de labelwaarde de waarde met kwaliteitsverklaring, dus BENG 2.
  - **Lezing B.** Lid 5 onder b toetst de BENG 2-waarde met kwaliteitsverklaring.
  - **Vraag.** Toetst lid 5 onder b de labelwaarde (EMGforf) of de BENG 2-waarde?
- **Labelelement h.** Art. 5.13a lid 1 onder h vraagt de productie van hernieuwbare energie in kWh.
  - **Lezing A (onze keuze).** Alleen de hernieuwbare elektriciteitsopwekking op eigen terrein: PV en andere hernieuwbare opwekking van hoofdstuk 16 van NTA 8800, zonder de elektriciteit van een (micro-)WKK. Zonnewarmte en omgevingswarmte zitten al in elementen c en i.
  - **Lezing B.** Ook hernieuwbare warmte, zoals zonnewarmte, in kWh.
  - **Vraag.** Bedoelt element h alleen hernieuwbare elektriciteit, of ook hernieuwbare warmte?
- **Gevolg in openbare gevallen.** Geen; de openbare rapporten tonen deze labelgegevens niet.

### Vraag 5. Luchtvolumestroom bij het forfaitaire ventilatorvermogen, formule 11.142 (p. 518; 2020+A1: 11.139, p. 495)

- **Plaats.** Formule 11.142 (p. 518) neemt q_V;ODA;req bepaald volgens 11.2.2.1. Bij 11.46–11.49 worden f_sys en f_ctrl, en daarmee q_V;ODA;req, voor de warmtebehoefte en de koudebehoefte apart berekend. Met maximale benutting van de geïnstalleerde capaciteit voor passieve koeling (tabel 11.6) is de waarde voor de koudebehoefte veel groter.
- **Lezing A (onze keuze).** q_V;ODA;req van de warmtebalans, in alle maanden.
- **Lezing B.** q_V;ODA;req van de koudebalans, of per maand de grootste van beide.
- **Gevolg in een openbaar geval.** Geval N (supermarkt, NTA 8800:2020+A1, ventilatiesysteem D.3 met CO₂-sturing en automatische passieve koelregeling) rekent in het rapport 5 164 kWh ventilatorenergie. Dat is tot op de kWh de forfaitaire formule met de luchtvolumestroom van de koudebalans (2 122 m³/h) over het hele jaar. Met de warmtebalans (938 m³/h) rekenen wij 2 283 kWh: −2,02 kWh/(m²·jr) op BENG 2.
- **Vraag.** Welke q_V;ODA;req geldt in 11.142: die van de warmtebalans, die van de koudebalans, of per maand de grootste? Als de koudebalans bedoeld is: ook in maanden zonder koudebehoefte?

### Vraag 6. Oppervlakte per gebruiksfunctie voor tapwater en verlichting bij een gemeenschappelijke ruimte (13.19, p. 538; hoofdstuk 14, p. 657 en 661; 6.6.4, p. 158)

- **Plaats.** 6.6.4 (p. 158) kent twee verdelingen van een gemeenschappelijke ruimte: voor de gebruiksfunctie in het gebouw over alle aangewezen functies (eerste alinea), en voor de gebruiksfunctie binnen een rekenzone alleen over de aangewezen functies die in die rekenzone liggen (laatste alinea). Formule 13.19 (p. 538) en de weging van t_D, t_N (p. 657) en P_n;spec (p. 661) wegen naar de gebruiksfuncties in de rekenzone. Dezelfde tekst staat in NTA 8800:2020+A1 (p. 515, 628–636), 2022 (p. 519, 633–641), 2023 (p. 527, 643–651) en 2024.
- **Lezing A (onze keuze).** De gebruiksoppervlakte binnen de rekenzone (6.6.4, laatste alinea). Formule 13.19 vermenigvuldigt met A_g van de rekenzone, en 14.4 (p. 656) laat de verlichtingszones samen A_g van de rekenzone dekken; een deel dat aan een functie buiten de rekenzone wordt toebedeeld, ligt niet in de rekenzone.
- **Lezing B.** De gebruiksoppervlakte in het gebouw (6.6.4, eerste alinea), omdat tabel 13.1 en de tabellen 14.1 en 14.3 waarden per gebruiksfunctie van het gebouw geven.
- **Gevolg in een openbaar geval.** Geval H (NTA 8800:2023) heeft een gemeenschappelijke ruimte van 49,20 m² in de rekenzone zonder sport, terwijl ook de sportfunctie erop is aangewezen. Het rapport volgt lezing B: 44,35 m² gaat naar sport, ook in de verlichting van de rekenzone zonder sport. Met lezing A rekenen wij 317 kWh minder tapwater en 248 kWh minder verlichting; BENG 2 wordt 80,74 in plaats van 81,86 kWh/(m²·jr) (rapport 80,01).
- **Vraag.** Geldt voor 13.19 en de weging in hoofdstuk 14 de gebruiksoppervlakte binnen de rekenzone of die in het gebouw? Ligt het deel van een gemeenschappelijke ruimte dat aan een functie buiten de rekenzone wordt toebedeeld, voor deze weging "in de rekenzone"?

---

Wij danken u voor uw aandacht en zijn graag bereid de berekeningen per geval toe te lichten.

Met vriendelijke groet,

[naam]
[functie]
[organisatie]

*Bijlage op verzoek: vergelijking met openbare rapporten (gevallen A–N), met de verschilanalyse per post.*
