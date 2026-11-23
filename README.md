# odzew.tech

Strona Odzew. Netlify publikuje folder `public/`.

## Jak zmienić stronę

1. Popraw `src/index.src.html` (treść, ceny, blok `KONFIG` z telefonem, e-mailem i numerem sekretarki).
2. Uruchom `python3 src/zbuduj.py`. Skrypt wkleja czcionki i logo i zapisuje `public/index.html`.
3. Wyślij zmiany na GitHuba. Netlify opublikuje je sam.

## Film na górze strony

Film leży w `public/wideo/odzew-film.mp4` (wersja zmniejszona pod stronę, ok. 8 MB), a obrazek widoczny przed odtworzeniem w `public/wideo/odzew-film-plakat.jpg`. Żeby wymienić film, podmień oba pliki pod tymi samymi nazwami.

## Co uzupełnić przed pokazaniem strony klientom

W bloku `KONFIG` w `src/index.src.html`:

- `telefon` i `email`: kontakt w stopce,
- `administrator`: dane firmy do polityki prywatności (nazwa, adres, NIP),
- `telefonDemo`: numer, pod którym odbiera sekretarka (teraz 41 230 67 85, numer z Zadarmy),
- `webhook`: adres automatyzacji, gdy powstanie serwer. Puste pole oznacza, że zgłoszenia z formularza zbiera Netlify Forms.

## Powiadomienia o rozmowach asystenta na Telegram

Po każdej rozmowie ElevenLabs wysyła dane na adres `https://odzew.tech/api/po-rozmowie`, a funkcja z `netlify/functions/po-rozmowie.mjs` przekazuje na Telegram podsumowanie, dane rozmówcy i transkrypcję.

W Netlify (Project configuration → Environment variables) muszą być trzy zmienne:

- `TELEGRAM_BOT_TOKEN`: token bota od @BotFather,
- `TELEGRAM_CHAT_ID`: identyfikator czatu (bot poda go po otwarciu `https://odzew.tech/api/telegram-start`),
- `ELEVENLABS_WEBHOOK_SECRET`: sekret pokazany przez ElevenLabs przy tworzeniu webhooka.

Po zmianie zmiennych trzeba wdrożyć stronę ponownie. Test funkcji: `node test/po-rozmowie.test.mjs`.
