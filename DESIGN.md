# Odzew: kierunek projektowy

Strona odzew.tech. Ten plik jest źródłem prawdy dla wyglądu: kod używa nazw z tego pliku (zmienne CSS w `src/index.src.html`), nigdy gołych wartości.

Kierunek nie powstał z porównania z bazą prawdziwych stron (narzędzie UXKIN nie jest podłączone). Wynika z marki, z tematu i z tego, co już jest w filmie i na profilach.

## Pomysł: „tablica i stoper”

Logo Odzewu to stoper w dymku rozmowy. Produkt sprzedaje jedną rzecz: czas odpowiedzi. Dlatego:

- **Czas jest elementem układu.** Godziny („sobota, 19:42”) stoją przy osi i prowadzą przez historię: najpierw na pierwszym ekranie, potem w sekcji o problemie.
- **Wygląd tablicy ostrzegawczej z budowy.** Płaskie pola żółtego i grafitu, gruba grafitowa rama 2 px, twardy cień bez rozmycia. Bez gradientów, szkła i miękkich szarych cieni.
- **Produkt narysowany w kodzie.** Rozmowa telefoniczna, SMS, wpis w lejku i raport to prawdziwe elementy HTML, a nie zdjęcia ani ikonki. Bez zdjęć stockowych i emoji.
- **Jedno mocne miejsce.** Scena na pierwszym ekranie (telefon dzwoni, Kamil odbiera, wychodzi SMS, powstaje wpis). Reszta strony jest spokojna.

Układ jest wyrównany do lewej, w kolumnie 1160 px. Każda sekcja ma własny kształt (oś czasu, szyna kroków, plan cenowy), zamiast siatki jednakowych kart.

```
[ żółty ]  H1 + 2 akcje            | scena: 19:42 telefon → 19:44 SMS → 19:44 lejek
[ biały ]  oś czasu utraconego zapytania  ───●───●───●───✕   + 2 liczby ze źródłem
[ grafit ] numer do Kamila         | zapis rozmowy, linia po linii
[ biały ]  nagłówek | film         → szyna 6 kroków ─①─②─③─④─⑤─⑥ → raport tygodniowy
[ beton ]  suwaki                  | wynik na graficie
[ biały ]  plan | PLAN POLECANY (żółty, większy) | plan  → gwarancja + 14 dni
[ beton ]  kto za tym stoi
[ biały ]  pytania (nagłówek z lewej, lista z prawej)
[ żółty ]  audyt: tekst            | formularz
[ grafit ] stopka: nawigacja, kontakt, dane firmy
```

## Kolory

| Nazwa | Wartość | Rola |
| --- | --- | --- |
| `--sygnal` | `#FFC21A` | Żółty marki. Tło pierwszego ekranu i sekcji audytu, plan polecany, przyciski i liczby na graficie. Nigdy jako tekst na białym. |
| `--sygnal-cien` | `#C99400` | Twardy cień obiektów leżących na żółtym. |
| `--sygnal-jasny` | `#FFF1C2` | Podkreślenie na białym: tło liczb, zaznaczenia. |
| `--grafit` | `#16181B` | Tekst, ramy, przycisk główny, ciemne sekcje. |
| `--grafit-2` | `#22252A` | Powierzchnia na ciemnym tle (zapis rozmowy, panele). |
| `--grafit-3` | `#3A3F46` | Linie na ciemnym tle. |
| `--papier` | `#FFFFFF` | Tło strony i pól formularza. |
| `--beton` | `#F2F3F0` | Tło sekcji naprzemiennych. |
| `--linia` | `#D9DCD6` | Ciche linie i obramowania na jasnym. |
| `--stal` | `#565B62` | Tekst drugiego planu na białym i betonie (kontrast 6,9:1). Nie na żółtym. |
| `--mgla` | `#C6CACF` | Tekst drugiego planu na graficie (11:1). |
| `--popiol` | `#9CA2A9` | Podpisy i źródła na graficie (7:1). |
| `--alarm` | `#B92D1C` | Utracone zlecenie na osi czasu, błędy formularza. Tło błędu `--alarm-tlo` `#FBE1DD`. |
| `--ok` | `#1B6B36` | Potwierdzenia. Tło `--ok-tlo` `#DDF3E1`. |

Zasady: na żółtym tylko grafit. Tekst zawsze co najmniej 4,5:1. Jeden żółty akcent na sekcję poza sekcjami żółtymi.

## Typografia

Jeden krój: **Barlow** (400, 600, 800), serwowany z własnego serwera z `/czcionki/`. Barlow wywodzi się z tablic i znaków drogowych, więc pasuje do pomysłu, a jedna rodzina to mniej plików. Cyfry w danych zawsze tabelaryczne (`font-variant-numeric: tabular-nums`).

| Nazwa | Rozmiar / interlinia | Grubość | Użycie |
| --- | --- | --- | --- |
| `--t-h1` | `clamp(2.375rem, 1.2rem + 4.9vw, 4.5rem)` / 1,0 | 800 | Jeden nagłówek na stronie |
| `--t-h2` | `clamp(1.875rem, 1.3rem + 2.5vw, 3rem)` / 1,05 | 800 | Nagłówki sekcji |
| `--t-h3` | `1.375rem` / 1,2 | 800 | Nagłówki w sekcjach |
| `--t-lead` | `clamp(1.125rem, 1rem + 0.5vw, 1.3125rem)` / 1,5 | 400 | Pierwszy akapit sekcji |
| `--t-tekst` | `1.125rem` (telefon `1.0625rem`) / 1,55 | 400 | Tekst |
| `--t-maly` | `0.9375rem` / 1,45 | 400 lub 600 | Opisy, listy w planach |
| `--t-mini` | `0.875rem` / 1,4 | 600 | Podpisy, źródła. Najmniejszy tekst na stronie (14 px) |
| `--t-dane` | zależnie od miejsca | 800 | Godziny, ceny, numer telefonu |

Nagłówki: `letter-spacing: -0.02em`, `text-wrap: balance`. Akapity: `text-wrap: pretty`, wiersz do 68 znaków. Bez wersalików w etykietach, bez kursywy i koloru na jednym słowie nagłówka.

Polska typografia: skrypt `src/zbuduj.py` sam wstawia twarde spacje po „w”, „z”, „i”, „a”, „o”, „u” oraz między liczbą a jednostką („449 zł”, „45 minut”).

## Odstępy i siatka

- Skala: 4, 8, 12, 16, 24, 32, 48, 64, 96 px (`--o-1` … `--o-9`).
- Kolumna: `min(1160px, 100% − 2 × margines)`, margines `clamp(20px, 4vw, 40px)`.
- Sekcja: `padding-block: clamp(56px, 8vw, 104px)`.
- Progi: 600 px, 900 px, 1100 px.

## Kształt i głębia

- Promienie: `--r-1` 8 px (pola, plakietki), `--r-2` 14 px (panele), `--r-3` 24 px (ekrany produktu), pigułka 999 px (tylko przyciski).
- Rama: `2px solid var(--grafit)` na obiektach ważnych. Ciche linie: `1.5px solid var(--linia)`.
- Cień: jeden, twardy: `6px 6px 0`. Kolor zależy od tła (`--cien`): na żółtym `--sygnal-cien`, na białym grafit albo żółty. Tylko scena, film, plan polecany i przyciski w stanie najechania.

## Komponenty

- **Przycisk główny**: grafitowy, biały tekst 800, pigułka, wysokość 52 px. Na graficie: żółty z grafitowym tekstem. Najechanie: przesuwa się o 2 px w górę i w lewo i dostaje twardy cień. Wciśnięcie: wraca i traci cień. Fokus: obrys 3 px z odstępem 3 px.
- **Przycisk drugi**: przezroczysty z ramą 2 px. Wersja telefoniczna ma dwa wiersze: podpis i numer.
- **Łącze**: podkreślenie 2 px, na najechaniu żółte tło.
- **Pole formularza**: 52 px, rama 1,5 px `#8C9198`, fokus: rama grafit 2 px i obrys. Etykieta nad polem, błąd pod polem (`--alarm`), komunikat sukcesu w `--ok-tlo`.
- **Scena** (pierwszy ekran): oś z godzinami, karta rozmowy na graficie, dymek SMS, wpis w lejku.
- **Oś czasu**: szyna 2 px z węzłami; ostatni węzeł w `--alarm`.
- **Szyna kroków**: sześć numerowanych węzłów połączonych linią (numer ma sens, bo to kolejność).
- **Plan cenowy**: dwa spokojne (rama cicha) i jeden polecany (żółte pole, rama, twardy cień, przycisk).
- **Akordeon pytań**: strzałka w kolumnie, po prawej; rozwijanie przez `grid-template-rows`.
- **Suwak**: obszar dotyku 44 px, uchwyt 28 px, wypełnienie grafitowe.
- **Nagłówek strony**: żółty, przyklejony; po przewinięciu niższy. Na telefonie menu pod przyciskiem.

## Ikony i obrazy

Ikony rysowane ręcznie w SVG: kreska 2 px, zaokrąglone końce, bez wypełnień. Żadnych emoji. Żadnych zdjęć stockowych. Zdjęcie właściciela i nagranie rozmowy dochodzą dopiero wtedy, gdy są prawdziwe (pola w `KONFIG`).

## Ruch

- Czasy: 200 ms (najechanie, wciśnięcie), 300–450 ms (wejścia, rozwijanie), 500 ms (liczniki). Krzywa `cubic-bezier(.2, .7, .2, 1)`.
- Jedna scena przy wczytaniu strony: telefon dzwoni → Kamil odbiera → SMS → wpis.
- Sekcje wchodzą raz, przy pierwszym pojawieniu się (16 px w górę i przenikanie). Oś czasu i szyna rysują się po kolei.
- Liczniki: dwie liczby ze źródłem i wynik kalkulatora.
- Zapis rozmowy pojawia się linia po linii.
- Strona nie przejmuje przewijania. Żadnych bibliotek.
- `prefers-reduced-motion: reduce` wyłącza wszystko: treść jest od razu w stanie końcowym.
- Bez JavaScriptu cała treść jest widoczna.

## Słownik

- Produkt: **wirtualny asystent** (nie „sekretarka”, nie „automat”, nie „bot”).
- Asystent na linii Odzewu: **Kamil**, rodzaj męski.
- „Sekretarka”, „Sekretarka + Zapytania”, „Biuro” to wyłącznie nazwy pakietów w cenniku.
- Zwracamy się na „Ty”, wielką literą.
