---
title: "Windows 11 C-schijf vol? Zo ruim je tijdelijke bestanden veilig op"
description: "Ervaar je acute prestatieproblemen op je C-schijf vanuit ons tech-kantoor in Amsterdam of Eindhoven? Leer hoe je snel en veilig temp-bestanden opruimt."
publishDate: 2026-10-15T18:30:00.000Z
image: "/images/tech-photo/tech-photo (1).jpg"
category: 'tech'
tags: ["Windows 11", "Schoonmaak", "IT Tips", "Prestaties"]
theme: "Warm Coffee Latte"
---



















Het was half drie op een drukke dinsdagmiddag op onze tech-campus in Eindhoven. Terwijl ik midden in een complexe troubleshoot-sessie zat voor een lokale partner, plofte er een paniekerig Slack-bericht binnen: een van onze developers kon geen code meer pushen omdat haar Windows 11 C-schijfklokje op rood stond—0 bytes vrije ruimte over. Het systeem liep vast, projectbestanden wilden niet opslaan en de ventilatoren loeiden als een opstijgende KLM-Boeing. Een acute performance-crisis die we direct moesten oplossen zonder belangrijke data te verliezen.

<div style="border-left: 4px solid #78350f; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">
<strong>De IT-Expert Realiteitscode:</strong> Voordat je willekeurig mappen gaat verwijderen en hoopt dat Windows blijft werken, moet je begrijpen waar die gigabytes naartoe verdwijnen. Paniek leidt tot het weggooien van essentiële systeemarchieven.
</div>

![Tech & IT Solution Guide](https://picsum.photos/seed/computer771/1000/550)

Waarom loopt je C-schijf zomaar vol?

In de praktijk zie ik bij Nederlandse werkplekken en thuis-setups meestal dezelfde drie boosdoeners die de C-schijf binnen de kortste keren verstoppen:

1. Tijdelijke Bestanden (Temp & Cache): Windows, webbrowsers en zware tools zoals Docker of Visual Studio dumpen continu gigabytes aan tijdelijke logbestanden en cachegegevens in verborgen mappen.

2. Windows Update Restanten: Na een grote OS-upgrade laat Microsoft vaak oude systeembestanden achter (zoals de `Windows.old`-map) voor het geval je wilt downgraden, goed voor zo'n 15 tot 30 GB aan verspilde ruimte.

3. Slaapstand (Hibernation) en Wisselbestand: De `hiberfil.sys` en `pagefile.sys` reserveren automatisch gigabytes op basis van je fysieke werkgeheugen, vaak onnodig groot als je een snelle SSD hebt.

---

Stap-voor-stap: Veilig en rigoureus opruimen

We gaan nu methodisch te werk. Geen rommelige derde-partij "downloader-apps" met adware, maar gewoon de ingebouwde, betrouwbare Windows-tools.

Stap 1: Gebruik de ingebouwde Opslag-inzichten (Storage Sense)
We beginnen met de modernste en veiligste methode in Windows 11.

1. Klik op Starten openInstellingen (het tandwielicoon).

2.  Ga naar Systeemen kies vervolgens voorOpslag.

3. Klik bovenaan op Tijdelijke bestanden. Windows scant nu je hele systeem op overbodige data zoals Windows Update-opschoning, logboeken van fouten en eerdere installaties.

4. Vink de items aan die je wilt verwijderen (laat persoonlijke downloads eventueel staan als je die nog wilt controleren).

5. Klik op Bestanden verwijderen.

Stap 2: De diepe handmatige snoei via Schijfopruiming
Voor het échte oude hang- en sluitwerk pakken we het klassieke hulpprogramma erbij.

1. Druk op de toetsencombinatie Windows-toets + R, typ `cleanmgr` en druk op Enter.

2. Selecteer je C-schijf en klik op OK.

3. Klik in het volgende venster direct op de knop Systeembestanden opschonen. Dit zorgt ervoor dat ook oude update-installaties worden meegenomen in de scan.

4. Vink in de lijst onder andere Vorige Windows-installatie(s)enWindows Update-opschoning aan.

5. Klik op OK en laat de tool zijn werk doen. Dit kan even duren.

<div style="border-left: 4px solid #78350f; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">
<strong>Pro-Tip van de Consultant:</strong> Als je merkt dat de map `C:\Windows\Temp` of `%temp%` alsnog volloopt door vastgelopen installaties, open dan de Opdrachtprompt als Administrator en voer een snelle schijfcontrole uit of leeg handmatig wat daar achterblijft na een reboot.
</div>

Stap 3: Apps en grote bestanden verplaatsen
Heb je na de opschoning nog steeds te weinig ademruimte? Dan wordt het tijd om grootverbruikers aan te pakken.

1. Ga opnieuw naar Instellingen > Systeem > Opslag.

2. Klik op Geïnstalleerde apps om te zien welke software gigantische hoeveelheden ruimte inneem (denk aan games of zware CAD-software). Verwijder wat je niet meer gebruikt.

3. Kijk bij Andere categorieën om te zien welke mappen (zoals Documenten of Bureaublad) onnodig groot zijn geworden en overweeg deze te verplaatsen naar een secundaire data-schijf (D-schijf).

---

Veelgestelde Vragen (FAQ)

1. Kan ik zomaar alle bestanden in de map `%temp%` handmatig verwijderen? Ja, in principe wel. Druk op `Windows + R`, typ `%temp%` en selecteer alles met `Ctrl + A` om het te wissen. Bestanden die momenteel door een openstaand programma worden gebruikt, kun je simpelweg overslaan ("overslaan" kiezen als Windows daarom vraagt).

2. Wat gebeurt er als ik de map `Windows.old` permanent verwijder?

Deze map wordt gebruikt om terug te keren naar een eerdere versie van Windows 11 als een update mislukt. Als je computer nu stabiel werkt en je hebt de schijfruimte hard nodig, kun je deze map veilig wissen via *Schijfopruiming*. Je kunt daarna alleen niet meer eenvoudig terugkeren naar de vorige OS-versie.

3. Hoe voorkom ik dat mijn C-schijf in de toekomst weer plotseling volloopt? Zet in de opslaginstellingen de functieOpslag-inzichten aan. Windows ruimt dan automatisch tijdelijke bestanden en prullenbak-items op op de achtergrond, zodat jij je kunt focussen op je echte werk in plaats van op harddisk-management.
