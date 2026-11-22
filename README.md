# odzew.tech

Strona Odzew. Netlify publikuje folder `public/`.

## Jak zmienić stronę

1. Popraw `src/index.src.html` (treść, ceny, blok `KONFIG` z telefonem, e-mailem i numerem sekretarki).
2. Uruchom `python3 src/zbuduj.py`. Skrypt wkleja czcionki i logo i zapisuje `public/index.html`.
3. Wyślij zmiany na GitHuba. Netlify opublikuje je sam.

## Co uzupełnić przed pokazaniem strony klientom

W bloku `KONFIG` w `src/index.src.html`:

- `telefon` i `email`: kontakt w stopce,
- `administrator`: dane firmy do polityki prywatności (nazwa, adres, NIP),
- `telefonDemo`: numer, pod którym odbiera sekretarka (teraz 41 230 67 85, numer z Zadarmy),
- `webhook`: adres automatyzacji, gdy powstanie serwer. Puste pole oznacza, że zgłoszenia z formularza zbiera Netlify Forms.
