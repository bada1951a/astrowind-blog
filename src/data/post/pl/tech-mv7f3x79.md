---
title: "Brak sygnału i migotanie monitora w laptopie: Zaawansowana naprawa sterowników i rejestru"
description: "Praktyczny przewodnik inżyniera IT: diagnoza konfliktów WDDM, analiza identyfikatorów Hardware ID oraz czyszczenie rejestru EDID przy problemach z dwoma monitorami."
publishDate: 2026-10-14T19:45:00.000Z
image: "/images/tech-photo/tech-photo (21).jpg"
category: "Hardware"
tags: ["Tech", "Troubleshooting", "Hardware"]
theme: "Deep Indigo System"
---













W pracy inżyniera wsparcia IT niewiele jest scenariuszy równie powtarzalnych i frustrujących dla użytkownika, jak nagła utrata stabilności wielomonitorowej stacji roboczej. Scenariusz z reguły wygląda identycznie: pracownik podłącza nowoczesnego ultrabooka do stacji dokującej Thunderbolt lub replikatora portów USB-C z dwoma monitorami roboczymi. Zamiast płynnego rozszerzenia pulpitu, jeden z ekranów cyklicznie gaśnie co kilkanaście sekund, a drugi wita komunikatem „Brak sygnału” (No Signal). W dziennikach systemowych pojawia się lawina ostrzeżeń o resecie sterownika ekranu, a użytkownik traci możliwość pracy.

<div style="border-left: 4px solid #4338ca; padding: 12px 16px; margin: 20px 0; background-color: rgba(67, 56, 202, 0.04); border-radius: 4px;">
<strong>Diagnostyka wstępn

a:</strong> Gdy oba zewnętrzne panele wyświetlają objawy desynchronizacji, w 85% przypadków wina nie leży w uszkodzeniu fizycznym przewodu, lecz w kolizji mechanizmu TDR (Timeout Detection and Recovery) jądra Windows oraz uszkodzonym buforze topologii w rejestrze systemowym.
</div>

Poniższy przewodnik opisuje procedurę, którą wdrażam w środowiskach korporacyjnych, gdy standardowe wciśnięcie skrótu `Win + Ctrl + Shift + B` zawodzi. Przejdziemy przez analizę niskopoziomową, inspekcję identyfikatorów Device ID oraz manualne czyszczenie stosu WDDM.

---

### Anatomia usterki: 3 źródła problemu na poziomie jądra i magistrali

Zrozumienie, dlaczego system traci synchronizację z monitorem zewnętrznym, wymaga spojrzenia na architekturę przesyłu sygnału w nowoczesnych laptopach wyposażonych w dwa układy graficzne (iGPU + dGPU).

1. Kolizja bufora ramki i architektury hybrydowej (Optimus / CrossFire)
W architekturze hybrydowej wyjścia wideo USB-C/DisplayPort fizycznie przechodzą przez magistralę zintegrowanego procesora graficznego (iGPU – Intel Iris Xe lub AMD Radeon), podczas gdy obciążenia 3D renderuje dedykowany procesor (dGPU – NVIDIA RTX). Jeśli wersje sterowników iGPU i dGPU posiadają niespójne biblioteki WDDM (Windows Display Driver Model), systemowy menedżer okien (*Desktop Window Manager* - `dwm.exe`) gubi klatki synchronizacji pionowej, wywołując reset sterownika i charakterystyczne czarne mignięcie.

![Hardware Diagnostic & Troubleshooting](https://images.unsplash.com/photo-1504384308090-c894fdcc538d? auto=format&fit=crop&w=1000&h=550&q=80)

2.  Timeout mechanizmu TDR w jądrze `dxgkrnl.sys`
Podsystem graficzny DirectX monitoruje czas odpowiedzi karty. Jeśli kontroler DisplayPort Alternate Mode lub transceiver stacji dokującej opóźni handshake EDID o więcej niż 2 sekundy podczas negocjacji szyfrowania HDCP, jądro systemu uznaje sterownik za zawieszony. Uruchamiana jest procedura TDR: jądro resetuje akcelerator graficzny, co objawia się natychmiastowym zgaśnięciem wszystkich paneli i przejściem drugiego monitora w tryb uśpienia. ## 3. Zaśmiecona pamięć podręczna EDID w gałęzi `GraphicsDrivers`
System Windows agresywnie cachuje informacje o każdym podłączonym kiedykolwiek wyświetlaczu. Gdy laptop jest regularnie przepinany między różnymi salami konferencyjnymi a domowym biurkiem, wpisy w rejestrze dotyczące konfiguracji, pozycji i profilu timingów ulegają fragmentacji i korupcji. System próbuje wymusić nieobsługiwane taktowanie pikseli (pixel clock) lub pasmo Display Stream Compression (DSC), co skutkuje całkowitym brakiem sygnału.

---

### Diagnostyka sprzętow

a: Identyfikatory Hardware ID

Zanim przejdziemy do modyfikacji plików binarnych, musimy precyzyjnie ustalić, który kontroler odpowiada za błądzący port wideo.

1. Uruchom narzędzie Menedżer urządzeń(kombinacja `Win + X` -> wybierzMenedżer urządzeń).

2. Rozwiń sekcję Karty graficzne.

3. Kliknij prawym przyciskiem myszy na zintegrowaną kartę (np. *Intel Iris Xe Graphics*) i wybierz Właściwości.

4. W zakładce Szczegółyrozwiń listęWłaściwośći wybierzIdentyfikatory sprzętu.

<div style="border-left: 4px solid #4338ca; padding: 12px 16px; margin: 20px 0; background-color: rgba(67, 56, 202, 0.04); border-radius: 4px;">
<strong>Zapisz wartości:</strong> Zwróć uwagę na ciąg znaków w formacie:<br>
<code>PCI\VEN_8086&DEV_9A49&SUBSYS_0A5C1028</code><br>
Gdzie <code>VEN_8086</code> oznacza dostawcę (Intel), a <code>DEV_9A49</code> to dokładny model rdzenia krzemowego. Pozwoli to dobrać sterownik czysty od modyfikacji producenta OEM (np. Dell/Lenovo/HP), które często opóźniają poprawki krytyczne dla protokołu DisplayPort.
</div>

---

### Procedura naprawcza krok po kroku

```
[Wykrycie usterki] 
       │
       ▼
[Krok 1: Wyczyszczenie bazy konfiguracji w Rejestrze] ──► (Usunięcie błędów EDID)
       │
       ▼
[Krok 2: Izolacja i czyszczenie sterowników (DDU/Safe Mode)]
       │
       ▼
[Krok 3: Sekwencyjna instalacja wg Hardware ID] ──────► (iGPU -> dGPU -> Chipset)
       │
       ▼
[Krok 4: Wymuszenie opóźnienia jądra (TdrDelay)] ─────► (Eliminacja migotania)
```

### Krok 1: Reset bufora konfiguracji monitorów w Edytorze rejestru
Operacja ta zmusza podsystem graficzny Windows do ponownego odpytania wszystkich podłączonych ekranów o ich natywne tablice EDID i wyczyszczenia błędnych profili multi-monitor.

1. Wciśnij `Win + R`, wpisz `regedit` i zatwierdź z uprawnieniami administratora.

2. Przejdź do następującego klucz

a:
   `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\GraphicsDrivers`

3. Odszukaj trzy podkatalogi:

   * `Configuration`
   * `Connectivity`
   * `ScaleFactors`

4. Kliknij prawym przyciskiem myszy na każdy z powyższych trzech podkluczy i wybierz Usuń (system odtworzy je automatycznie w stanie nieskażonym przy następnym wykryciu sprzętu).

```reg
; Szybki eksport zapobiegawczy z poziomu Wiersza polecenia (Administrator):
reg export "HKLM\SYSTEM\CurrentControlSet\Control\GraphicsDrivers\Configuration" C:\Backup_Config.reg
```

### Krok 2: Usunięcie sterowników widmowych i czyszczenie magazynu sterowników
Zwykłe odinstalowanie sterownika z poziomu Menedżera urządzeń pozostawia pliki INF w magazynie `DriverStore`. Wykorzystamy dedykowane narzędzie do całkowitej sanacji.

1. Pobierz narzędzie Display Driver Uninstaller (DDU).

2. Uruchom system w trybie awaryjnym:

   * Przytrzymaj klawisz `Shift` i kliknij Uruchom ponownie w menu Start.
   * Przejdź do: Rozwiąż problemy->Opcje zaawansowane->Ustawienia uruchamiania-> wciśnij klawisz `4` (Włącz tryb awaryjny).

3. Uruchom DDU z uprawnieniami administrator

a:
   * Jako typ urządzenia wybierz Karta graficzna. * Wybierz producenta dedykowanego układu (np. NVIDIA) i kliknij Wyczyść i NIE restartuj.
   * Następnie wybierz producenta zintegrowanego układu (Intel/AMD) i wybierz Wyczyść i uruchom ponownie.

<div style="border-left: 4px solid #4338ca; padding: 12px 16px; margin: 20px 0; background-color: rgba(67, 56, 202, 0.04); border-radius: 4px;">
<strong>Ważne:</strong> Odłącz kabel sieciowy Ethernet oraz rozłącz Wi-Fi przed restartem. Zapobiegnie to automatycznemu zaciągnięciu przestarzałego sterownika generycznego przez usługę Windows Update w trakcie rozruchu.
</div>

### Krok 3: Prawidłowa sekwencja instalacji pakietów sterowników
Zainstalowanie oprogramowania w złej kolejności to najczęstszy błąd administratorów. W architekturze zintegrowanej obowiązuje rygorystyczna hierarchi

a:

1. Magistrala i Thunderbolt: Zainstaluj najnowszy pakiet *Intel Serial IO Driver* oraz *Thunderbolt Controller Driver* (jeśli laptop korzysta z procesora Intel Core).

2. Karta zintegrowana (iGPU): Zainstaluj sterownik pobrany bezpośrednio ze strony Intel lub AMD, weryfikując zgodność z wcześniej zapisanym `DEV_ID`.

3. Karta dedykowana (dGPU): Na samym końcu zainstaluj sterownik NVIDIA/AMD, wybierając opcję „Czysta instalacja”.

4. Dopiero po zainstalowaniu kompletu podłącz monitory do stacji lub portów USB-C.

### Krok 4: Modyfikacja tolerancji TDR w Wierszu polecenia
Jeśli monitory nadal wykazują sporadyczne migotanie pod obciążeniem (np. przy przełączaniu okien przeglądarki z akceleracją sprzętową), należy zwiększyć margines tolerancji jądra dla opóźnień magistrali DisplayPort.

Uruchom Wiersz polecenia jako administrator i wprowadź poniższe poleceni

a:

```cmd
reg add "HKLM\SYSTEM\CurrentControlSet\Control\GraphicsDrivers" /v TdrDelay /t REG_DWORD /d 8 /f
reg add "HKLM\SYSTEM\CurrentControlSet\Control\GraphicsDrivers" /v TdrDdiDelay /t REG_DWORD /d 8 /f
```

Wartość domyślna wynosi 2 sekundy. Zwiększenie jej do 8 sekund eliminuje fałszywe resety stosu graficznego podczas renegocjacji linku DisplayPort Alternate Mode, nie wpływając negatywnie na stabilność systemu.

---

### Ostrzeżenia techniczne i prewencja

Praca na niskopoziomowych komponentach wideo niesie za sobą ryzyko utraty obrazu na wszystkich podłączonych ekranach:

* Zasilanie stacji dokującej (Power Delivery): Zawsze upewnij się, że stacja USB-C/Thunderbolt ma podłączony dedykowany zasilacz o mocy minimum 100W–130W. Niedobory zasilania na magistrali powodują chwilowe spadki napięcia na liniach sygnałowych High-Speed DisplayPort, co jest mylone przez system z awarią sterownika. * Agresywne kable pasywne: W konfiguracjach dwumonitorowych powyżej rozdzielczości 1440p (QHD) przy 60 Hz nie należy stosować tanich kabli pasywnych USB-C do HDMI. Zawsze wybieraj przewody z aktywnym konwerterem poziomu sygnału i certyfikacją DisplayPort 1.4 lub HDMI 2.

1. * Blokada nadpisywania przez Windows Update: Skonfiguruj zasady grupy (`gpedit.msc`), przechodząc do: *Konfiguracja komputera* -> *Szablony administracyjne* -> *System* -> *Instalacja urządzeń* -> *Ograniczenia dotyczące instalacji urządzeń*, aby uniemożliwić systemowi automatyczną wymianę zainstalowanego ręcznie, stabilnego sterownika na wersję z repozytorium Microsoftu.

---

### Często zadawane pytania (FAQ)

1. Czy uszkodzony lub zbyt długi kabel może wywoływać błędy systemowe TDR w dzienniku zdarzeń?  

Tak. Jeżeli kabel ma długość przekraczającą 2 metry bez aktywnego wzmacniacza sygnału lub nie posiada odpowiedniego ekranowania, na liniach transmisyjnych pojawia się zjawisko *DisplayPort link training error*. Karta graficzna próbuje obniżyć taktowanie lub renegocjować pasmo, co zamraża potok renderowania i zmusza sterownik `dxgkrnl.sys` do zainicjowania procedury naprawczej TDR.

2. Dlaczego pojedynczy monitor działa perfekcyjnie, a problem pojawia się dopiero po wpięciu drugiego ekranu? Obsługa dwóch monitorów wymaga podwojenia przepustowości na współdzielonym łączu PCIe oraz aktywacji technologii MST (Multi-Stream Transport). Wielu tańszych producentów stacji dokujących implementuje huby MST, które wchodzą w konflikt z mechanizmem zarządzania energią ASPM (Active State Power Management) w laptopie. W efekcie kontroler odcina zasilanie drugiego strumienia wideo przy braku gwałtownych zmian obrazu.

3. Czy wyłączenie zintegrowanej karty graficznej (iGPU) w Menedżerze urządzeń rozwiąże konflikt?  

W żadnym wypadku nie wolno tego robić w laptopach bez sprzętowego przełącznika MUX switch. W większości konstrukcji matryca laptopa oraz porty wyjściowe są fizycznie podpięte pod piny wyjściowe iGPU. Wyłączenie zintegrowanego układu w Menedżerze urządzeń spowoduje całkowite wyłączenie akceleracji sprzętowej, spadek rozdzielczości do trybu podstawowego Microsoft Basic Display Driver i brak możliwości wyprowadzenia sygnału na jakiekolwiek ekrany zewnętrzne.
