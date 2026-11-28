# odzew.tech

Strona Odzew. Netlify publikuje folder `public/`.

## Jak zmienić stronę

1. Popraw `src/index.src.html` (treść, style, skrypty, ceny, blok `KONFIG`). Polityka prywatności jest w `src/polityka-prywatnosci.src.html`.
2. Uruchom `python3 src/zbuduj.py`. Skrypt składa folder `public/`.
3. Wyślij zmiany na GitHuba. Netlify opublikuje je sam.

Wygląd opisuje `DESIGN.md`: kolory z rolami, typografia, odstępy, komponenty, ruch i słownik. Kod używa nazw z tego pliku.

Co robi `src/zbuduj.py`:

- wkleja logo i ikonę karty,
- kopiuje czcionki Barlow do `public/czcionki/` (osobne pliki, w `netlify.toml` mają pamięć podręczną na rok),
- wstawia twarde spacje po „w”, „z”, „i”, „a”, „o”, „u” oraz między liczbą a jednostką, więc w źródle piszesz zwykłe spacje,
- przenosi nagłówek, stopkę i style ze strony głównej na podstronę polityki (fragmenty oznaczone `wspolne:nazwa`),
- nie rusza wartości wysyłanych formularzem.

## Plansza „Trwają prace nad stroną"

Na górze `src/zbuduj.py` jest przełącznik `TRWAJA_PRACE`.

- `True`: pod adresem głównym jest plansza z `src/prace.src.html`, a cała strona jest pod `https://odzew.tech/podglad/` (polityka pod `/podglad/polityka-prywatnosci/`). W podglądzie widać notatki w przerywanej ramce: mówią, czego jeszcze brakuje. Na stronie głównej nigdy się nie pokażą.
- `False`: cała strona wraca na adres główny, a polityka jest pod `/polityka-prywatnosci/`.

Po zmianie przełącznika uruchom `python3 src/zbuduj.py` i wyślij zmiany na GitHuba.

## Film

Film leży w `public/wideo/odzew-film.mp4` (wersja zmniejszona pod stronę, ok. 8 MB), a obrazek widoczny przed odtworzeniem w `public/wideo/odzew-film-plakat.jpg`. Żeby wymienić film, podmień oba pliki pod tymi samymi nazwami. Film wczytuje się dopiero po kliknięciu.

## Blok KONFIG

Na górze `src/index.src.html`. Puste pole nie pokazuje się na stronie, więc nic nie trzeba kasować.

- `telefon`, `email`: kontakt w stopce i przy formularzu,
- `administrator`: dane firmy do stopki i polityki prywatności (nazwa, adres, NIP),
- `telefonDemo`: numer, pod którym odbiera Kamil (teraz 41 230 67 85, numer z Zadarmy),
- `wlasciciel`, `zdjecie`, `oMnie`: sekcja „Kto za tym stoi” (bez zdjęcia jest monogram),
- `nagranie`, `nagranieOpis`: nagranie prawdziwej rozmowy; odtwarzacz pojawia się dopiero po wpisaniu adresu pliku,
- `webhook`: adres automatyzacji, gdy powstanie serwer. Puste pole oznacza, że zgłoszenia z formularza zbiera Netlify Forms.

Formularz nazywa się `audyt`, a pole-pułapka `website`. Tych nazw nie zmieniaj, bo Netlify rozpoznaje po nich zgłoszenia.

## Powiadomienia o rozmowach asystenta na Telegram

Po każdej rozmowie ElevenLabs wysyła dane na adres `https://odzew.tech/api/po-rozmowie`, a funkcja z `netlify/functions/po-rozmowie.mjs` przekazuje na Telegram podsumowanie, dane rozmówcy i transkrypcję.

W Netlify (Project configuration → Environment variables) muszą być trzy zmienne:

- `TELEGRAM_BOT_TOKEN`: token bota od @BotFather,
- `TELEGRAM_CHAT_ID`: identyfikator czatu (bot poda go po otwarciu `https://odzew.tech/api/telegram-start`),
- `ELEVENLABS_WEBHOOK_SECRET`: sekret pokazany przez ElevenLabs przy tworzeniu webhooka.

Po zmianie zmiennych trzeba wdrożyć stronę ponownie. Test funkcji: `node test/po-rozmowie.test.mjs`.
