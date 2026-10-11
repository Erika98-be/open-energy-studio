# Vragen aan NEN / NTA 8800-commissie

Concepten voor vragen over de interpretatie van NTA 8800:2025+C1:2026. Ze zijn in eigen woorden opgesteld en verwijzen alleen naar paginanummers. Aanleiding is de vergelijking met openbare BENG-rapporten van geattesteerde software ([nta8800-vergelijking-openbare-rapporten.md](nta8800-vergelijking-openbare-rapporten.md)).

Alle acht vragen staan ook in een verzendklare brief aan NEN en RVO, met per vraag de twee lezingen en het gevolg in de openbare gevallen: [nta8800-vragen-nen-brief.md](nta8800-vragen-nen-brief.md). Werk die brief bij als een vraag hier verandert.

## 1. Afgifteverlies koeling, formule 10.15 (p. 376)

**Situatie.** Formule 10.15 geldt als θ_int,inc − θ_e,comb kleiner is dan 0. Het verlies is dan de koudeafgifte maal het maximum van twee waarden: de verhouding Δθ_int,inc / (θ_int,inc − θ_e,comb) en 0,15. Bij vloerkoeling met forfaitaire waterzijdige inregeling en regeling volgt uit tabel 10.35 en tabel 10.5 een Δθ_int,inc van −3,05 tot −3,55 K. In de tussenmaanden (mei, september) ligt θ_e,comb maar net boven θ_int,inc, zodat de noemer klein is en de verhouding groot wordt.

**Gevolg bij letterlijke toepassing.** Over het jaar is het afgifteverlies 80–83 % van de koudebehoefte. In mei en september is het groter dan de behoefte zelf. In drie woningen leidt dit tot +1,5 tot +8,6 kWh/(m²·jr) BENG 2 ten opzichte van de gepubliceerde rapporten. Die rapporten impliceren een verlies van 16–42 % van de behoefte, dicht bij de ondergrens van 0,15.

**Vraag.**
- Is het de bedoeling dat de verhouding onbegrensd groot kan worden als θ_e,comb maar net boven θ_int,inc ligt, zodat het verlies groter wordt dan de behoefte?
- Of is een bovengrens bedoeld, bijvoorbeeld een MIN in plaats van een MAX met 0,15, of een maximum van het verlies als fractie van de behoefte?
- Als er een bedoelde begrenzing is: hoe moet die worden toegepast?

## 2. Regelenergie koeling, formule 10.87 (p. 425)

**Situatie.** Formule 10.87 rekent met een regelvermogen van 0,010 kW dat volgens de tekst altijd in bedrijf is. Dat geeft 87,6 kWh per jaar per koelopwekker, ook voor een omkeerbare warmtepomp die in de zomer koelt. De gepubliceerde rapporten tonen voor de hulpenergie van koeling circa 10 kWh per jaar, wat overeenkomt met alleen pompenergie.

**Vraag.**
- Geldt de regelenergie van 10.87 in alle twaalf maanden, ook buiten het koelseizoen?
- Geldt ze ook wanneer de koeling wordt geleverd door een omkeerbare warmtepomp waarvan de regeling al in de verwarmingsberekening (hulpenergie van de warmtepomp) is meegenomen?

## 3. f_prac bij een kwaliteitsverklaring van een warmtepomp (p. 337, 340, 615–617)

**Situatie.** Formule 9.62 (tabelroute) heeft f_prac 1; formule 9.63 (gegevens volgens NEN-EN 14511/14825 via bijlage Q) heeft 0,95. §9.1 (p. 285) laat een kwaliteitsverklaring de tabelwaarde vervangen. Op p. 615 staat dat een kwaliteitsverklaring voor verwarming is opgesteld volgens bijlage Q. Voor tapwater geeft 13.152 f_prac 1,0 aan de forfaitaire waarden van 13.8.4.5–13.8.4.7 en 0,95 in alle overige gevallen.

**Gekozen lezing.** Een gedeclareerde COP voor verwarming valt onder 9.63 met 0,95. Een gedeclareerd tapwaterrendement is geen forfaitaire waarde en krijgt 0,95. Dit komt tot op de kWh overeen met de gepubliceerde rapporten.

**Vraag.** Klopt deze lezing, of blijft een gedeclareerde waarde die de tabelwaarde vervangt binnen 9.62 en 13.8.4.7 met f_prac 1?

## 4. A0 en labelelement h bij een woning (Omgevingsregeling art. 5.11 en 5.13a)

Deze punten gaan over de Omgevingsregeling (BWBR0045528, versie 2026-10-01), niet over NTA 8800. Ze staan hier omdat ze dezelfde vorm hebben: een lezing die de kern kiest en die de minister of RVO kan bevestigen.

**A0, voorwaarde b.**
- **Situatie.** Art. 5.11 lid 4 laat het primair fossiel energiegebruik van een woning bij energiemaatregelen op gebiedsniveau rekenen met forfaitaire waarden (EMGforf). Lid 5 onder b toetst "het primair fossiel energiegebruik" aan bijlage IXa. BENG 2 rekent met de kwaliteitsverklaring.
- **Gekozen lezing.** Lid 5 onder b toetst dezelfde waarde als lid 4, dus de labelwaarde met EMGforf. Een woning met een warmtenet met kwaliteitsverklaring kan zo BENG 2 ≤ 27 hebben en toch geen A0 krijgen. Voor utiliteit (art. 5.12 lid 4) is de labelwaarde de waarde met kwaliteitsverklaring, dus BENG 2.
- **Vraag.** Toetst lid 5 onder b de labelwaarde (EMGforf) of de BENG 2-waarde?

**Labelelement h.**
- **Situatie.** Art. 5.13a lid 1 onder h vraagt "de productie van hernieuwbare energie in kWh".
- **Gekozen lezing.** De kern geeft de hernieuwbare elektriciteitsopwekking op eigen terrein (PV en andere hernieuwbare opwekking van hoofdstuk 16), zonder de elektriciteit van een (micro-)WKK, die niet hernieuwbaar is (5.14b). Zonnewarmte en omgevingswarmte tellen niet mee in h: ze zitten in het aandeel hernieuwbare energie (element c) en in de belangrijkste hernieuwbare bron (element i). Een zonneboiler staat bovendien al apart bij de installaties (art. 5.13 onder c).
- **Vraag.** Bedoelt h alleen hernieuwbare elektriciteit, of ook hernieuwbare warmte (zonnewarmte) in kWh?

## 5. Luchtvolumestroom van het forfaitaire ventilatorvermogen, formule 11.142 (p. 518; 2020+A1: 11.139, p. 495)

**Situatie.** Het forfaitaire ventilatorvermogen is f_SFP · f_systype · q_V;ODA;req;zi,mi · c, met q_V;ODA;req "bepaald volgens 11.2.2.1". Bij 11.46–11.49 staat dat f_sys en f_ctrl, en dus q_V;ODA;req, voor warmtebehoefte en voor koudebehoefte apart worden berekend. Met maximale benutting van de geïnstalleerde capaciteit voor passieve koeling (tabel 11.6, τ_sysC) is de waarde voor koudebehoefte veel groter dan die voor warmtebehoefte. Formule 11.142 zegt niet welke van de twee geldt.

**Gekozen lezing.** De kern neemt q_V;ODA;req van de warmtebalans, in alle maanden.

**Gevolg.** Openbaar geval N (supermarkt, D.3 met CO2-sturing en automatische passieve koelregeling) rekent in Uniec 3.0.7.1 5 164 kWh ventilatorenergie: tot op de kWh f_SFP · 2 · q_V;ODA;req van de koudebalans (2 122 m³/h) over het hele jaar, gedeeld door f_prac;vent 0,9. De kern rekent met de warmtebalans (938 m³/h) 2 283 kWh; dat is −2,02 kWh/(m²·jr) op BENG 2.

**Vraag.**
- Welke q_V;ODA;req geldt in 11.142: die van de warmtebalans, die van de koudebalans, of per maand de grootste?
- Als de koudebalans bedoeld is: ook in maanden zonder koudebehoefte?

## 6. Oppervlakte per gebruiksfunctie voor tapwater en verlichting bij een gemeenschappelijke ruimte (13.19, p. 538; hoofdstuk 14, p. 657 en 661; 6.6.4, p. 158)

**Situatie.** 6.6.4 kent twee verdelingen van een gemeenschappelijke ruimte: voor de gebruiksfunctie in het gebouw over alle aangewezen functies, en voor de gebruiksfunctie binnen een rekenzone alleen over de aangewezen functies die in die rekenzone liggen. Formule 13.19 weegt Q_W;nd;spec naar "de gebruiksfuncties usi in de beschouwde rekenzone"; t_D, t_N (p. 657) en P_n;spec (p. 661) wegen naar "de gebruiksfuncties die in de rekenzone zijn gelegen". Dezelfde tekst staat in 2020+A1 (p. 515, 628–636), 2022 (p. 519, 633–641), 2023 (p. 527, 643–651) en 2024.

**Gekozen lezing.** De kern neemt de verdeling binnen de rekenzone als hij deze lijsten zelf vult. Een ingevulde lijst gaat altijd voor.

**Argumenten (review 25).**
- *Voor de verdeling binnen de rekenzone.* De laatste alinea van 6.6.4 (2025+C1 p. 158; 2023 p. 145) definieert juist "de gebruiksoppervlakte van een gebruiksfunctie binnen een rekenzone": alleen de gemeenschappelijke ruimten binnen de rekenzone tellen mee, en alleen de aangewezen functies "voor zover deze gebruiksfuncties zijn gelegen binnen de rekenzone". Formule 13.19 vermenigvuldigt de gewogen Q_W;nd;spec met A_g;zi van de rekenzone (bepaald volgens 6.6), en 14.4 (p. 656) eist dat de verlichtingszones samen A_g van de rekenzone dekken. Een deel van de ruimte dat aan een functie buiten de rekenzone wordt toebedeeld, ligt dus niet in de rekenzone en hoort niet in de weging.
- *Voor de gebouwverdeling.* De eerste alinea van 6.6.4 met de opmerking toedeelt een gemeenschappelijke ruimte aan alle aangewezen functies, en tabel 13.1 en de tabellen 14.1 en 14.3 geven waarden per gebruiksfunctie van het gebouw. Wie de functie-indeling voor tapwater en verlichting als kenmerk van het gebouw leest, komt op de gebouwverdeling uit, zoals Uniec 3.2.9.2 doet.
- De letterlijke woorden "in de beschouwde rekenzone" (13.19) en "die in de rekenzone zijn gelegen" (p. 657 en 661) sluiten aan bij de laatste alinea van 6.6.4; daarom kiest de kern die lezing.

**Gevolg.** Openbaar geval H (Uniec 3.2.9.2, NTA 8800:2023) heeft een gemeenschappelijke ruimte van 49,20 m² in de rekenzone zonder sport, terwijl ook de sportfunctie erop is aangewezen. Uniec neemt voor tapwater en verlichting de gebouwverdeling: 44,35 m² gaat naar sport, ook in de verlichting van de rekenzone zonder sport. Met de verdeling binnen de rekenzone rekent de kern 317 kWh minder tapwater en 248 kWh minder verlichting; BENG 2 wordt 80,74 in plaats van 81,86 (rapport 80,01).

**Vraag.**
- Geldt voor 13.19 en de weging in hoofdstuk 14 de gebruiksoppervlakte binnen de rekenzone (6.6.4, laatste alinea) of die in het gebouw (6.6.4, eerste alinea)?
- Ligt het deel van een gemeenschappelijke ruimte dat aan een functie buiten de rekenzone wordt toebedeeld, voor deze weging "in de rekenzone"?

## 7. Warmtecapaciteit van lucht in 11.115 en 11.119 (p. 505 en 506; 2022: p. 486 en 487)

**Situatie.** Formule 11.119 geeft de warmte van de verwarmingsbatterij van een luchtbehandelingskast als q_V;SUP;dis;in · (ρ·c)_a · t · (ϑ_SUP;dis;in − ϑ_SUP;hu), gedeeld door het rendement van 11.120; 11.115 geeft de koude van de koelbatterij op dezelfde manier. Bij beide staat c_a = 0,000 027 9 kWh/(kg·K). Elders rekent de norm met ρ_a·c_a = 1,205 kg/m³ · 1 005 J/(kg·K) = 1 211 J/(m³·K) (bij 8.49 en 8.57), dus c_a = 0,000 279 kWh/(kg·K): tien keer zo groot. Dezelfde waarde 0,000 027 9 staat in de uitgaven 2022 en 2025+C1.

**Gekozen lezing.** De kern rekent met de gedrukte waarde.

**Gevolg.** De zone krijgt toevoerlucht op de temperatuur van tabel 11.15, en haar warmtebehoefte daalt met de volle warmte die de batterij toevoegt; de batterij zelf telt maar een tiende daarvan. In openbaar geval O (gezondheidszorgfunctie, D.3 met de LBK in de zone, Uniec 3.1.5.0, NTA 8800:2022) telt de batterij 279 kWh in plaats van 2 794 kWh. Met de gedrukte waarde rekent de kern BENG 2 47,75, met 0,000 279 49,80; het rapport geeft 49,49. Bij geval L (school, LBK buiten de zone) is het 18,63 tegen 23,82, rapport 25,36.

**Vraag.**
- Is c_a = 0,000 027 9 kWh/(kg·K) in 11.115 en 11.119 een drukfout voor 0,000 279 kWh/(kg·K)?
- Zo niet: waarom telt de batterij een tiende van de warmte die de toevoerlucht volgens 11.3.2 en tabel 11.15 krijgt?

## 8. Gevel aan een aangrenzende onverwarmde serre bij TOjuli (5.7.2, p. 115–118)

**Situatie.** Stap A van 5.7.2 laat constructies naar een aangrenzende onverwarmde ruimte buiten A_T;or, maar maakt een uitzondering voor een aangrenzende onverwarmde serre (AOS): het geveldeel dat aan de serre grenst, telt mee bij zijn oriëntatie (p. 115). Stap 2 telt voor die oriëntatie H_C;D;juli;k en Q_C;sol;juli;k op van constructies tussen de rekenzone en "de buitenlucht of serre" (p. 116–117). Stap 1 bepaalt H_C;D;juli;k echter volgens 8.2, en een constructie naar een serre valt niet onder 8.2 maar onder 8.4 (H_U met b_U). Stap B noemt geen component voor H_U. De zonnewinst via de serre is de indirecte winst van 7.30b.

**Gekozen lezing.** Zolang dit niet vaststaat, laat de kern het serregeveldeel, zijn transmissie en de indirecte serrewinst buiten de verdeling per oriëntatie, net als bij een gewone aangrenzende onverwarmde ruimte. Een rekenzone met een serre krijgt bij een berekende TOjuli de melding `tojuli_sunroom_facade_left_out`.

**Gevolg.** Geen openbaar geval heeft een serre. Ligt de serre op de enige gevel van een oriëntatie, dan kan die oriëntatie onder de 3 m² van stap A blijven en niet worden beoordeeld, terwijl de serre juist zonnewinst geeft.

**Vraag.**
- Welke warmteoverdrachtscoëfficiënt hoort in 5.40 en in de julibalans bij het geveldeel naar de serre: U·A alsof het een buitengevel is, b_U·H_zi;ztu volgens 8.4, of geen?
- Telt de indirecte zonnewinst van 7.30b als Q_C;sol;juli;k van dat geveldeel, op zijn oriëntatie?
