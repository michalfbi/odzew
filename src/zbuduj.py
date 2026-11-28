# Składa stronę z src/ do public/: stronę główną, politykę prywatności i planszę „Trwają prace”.
import base64, re, os, shutil
import pathlib

# True  = odwiedzający widzą planszę „Trwają prace nad stroną" (src/prace.src.html),
#         a cała strona jest dalej pod adresem /podglad/ (poza wyszukiwarkami).
# False = cała strona wraca na adres główny, a /podglad/ znika.
TRWAJA_PRACE = True

TU = pathlib.Path(__file__).resolve().parent
PUB = TU.parent / 'public'
F = TU / 'fonty'
BAZA = '/podglad/' if TRWAJA_PRACE else '/'
LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
ZAKRESY = [('latin', LATIN), ('latin-ext', EXT)]


def czcionki_z_serwera():
    """Strona: Barlow jako osobne pliki w public/czcionki/ (długa pamięć podręczna w netlify.toml)."""
    (PUB / 'czcionki').mkdir(parents=True, exist_ok=True)
    css, preload = '', ''
    for w in (400, 600, 800):
        for sub, rng in ZAKRESY:
            plik = f'barlow-{sub}-{w}-normal.woff2'
            shutil.copyfile(F / plik, PUB / 'czcionki' / plik)
            css += f"@font-face{{font-family:'Barlow';font-style:normal;font-weight:{w};font-display:swap;src:url(/czcionki/{plik}) format('woff2');unicode-range:{rng}}}\n"
            if w in (400, 800):
                preload += f'<link rel="preload" href="/czcionki/{plik}" as="font" type="font/woff2" crossorigin>\n'
    return css.strip(), preload.strip()


def czcionki_wklejone():
    """Plansza „Trwają prace”: czcionki wklejone w plik, bez zmian."""
    css = ''
    for fam, pkg, weights in [('Barlow', 'barlow', [800]), ('Inter', 'inter', [400, 600, 700])]:
        for w in weights:
            for sub, rng in ZAKRESY:
                b = base64.b64encode(open(F / f'{pkg}-{sub}-{w}-normal.woff2', 'rb').read()).decode()
                wr = '700 800' if fam == 'Barlow' else str(w)
                css += f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{wr};font-display:swap;src:url(data:font/woff2;base64,{b}) format('woff2');unicode-range:{rng}}}\n"
    return css


def logo(name):
    s = open(TU / 'logo' / f'{name}.svg').read()
    return re.sub(r' width="[\d.]+" height="[\d.]+"', '', s, count=1)


def wstaw(src, fonty, preload=''):
    return (src.replace('%%FONTS%%', fonty).replace('%%PRELOAD%%', preload)
            .replace('%%LOGO_ZOLTE%%', logo('odzew-logo-na-zolte-tlo'))
            .replace('%%LOGO_CIEMNE%%', logo('odzew-logo-na-ciemne-tlo'))
            .replace('%%FAVICON%%', base64.b64encode(open(TU / 'logo' / 'favicon.svg', 'rb').read()).decode())
            .replace('%%BAZA%%', BAZA))


ZNACZNIKI = [r'<!--wspolne:(\w+)-->(.*?)<!--/wspolne:\1-->', r'/\*wspolne:(\w+)\*/(.*?)/\*/wspolne:\1\*/']


def czesci_wspolne(src):
    """Fragmenty strony głównej oznaczone „wspolne:nazwa” trafiają też na podstrony (%%WSPOLNE:nazwa%%)."""
    return {m.group(1): m.group(2).strip() for wz in ZNACZNIKI for m in re.finditer(wz, src, flags=re.S)}


def bez_znacznikow(src):
    return re.sub(r'<!--/?wspolne:\w+-->\n?|/\*/?wspolne:\w+\*/\n?', '', src)


JEDNOSTKI = r'(zł|minut\w*|min\b|dni\w*|sekund\w*|godzin\w*|miesi\w+|okien|netto)'
ZNACZNIK_W_WIERSZU = re.compile(r'<(a|b|span|strong)\b')


def twarde_spacje(html):
    """Polska typografia: „w”, „z”, „i”, „a”, „o”, „u” nie zostają na końcu wiersza, liczba nie odrywa się od jednostki."""
    # wartości wysyłane formularzem (option, textarea) i tytuł karty zostają bez zmian
    cz = re.split(r'(<script\b.*?</script>|<style\b.*?</style>|<option\b.*?</option>|<textarea\b.*?</textarea>|<title>.*?</title>|<!--.*?-->|<[^>]+>)', html, flags=re.S)
    for i in range(0, len(cz), 2):
        t = cz[i]
        if not t.strip():
            continue
        t = re.sub(r'(?<![\w&;])([wziaouWZIAOU])[ \t\n]+(?=\S)', r'\1&nbsp;', t)
        if i + 1 < len(cz) and ZNACZNIK_W_WIERSZU.match(cz[i + 1]):
            t = re.sub(r'(?<![\w&;])([wziaouWZIAOU])[ \t]+$', r'\1&nbsp;', t)
        t = re.sub(r'(\d) (\d{3})\b', r'\1&nbsp;\2', t)
        t = re.sub(r'(\d\.?) ' + JEDNOSTKI, r'\1&nbsp;\2', t)
        cz[i] = t
    return ''.join(cz)


def zapisz(sciezka, tresc):
    sciezka.parent.mkdir(parents=True, exist_ok=True)
    open(sciezka, 'w', encoding='utf8').write(tresc)
    print(sciezka.relative_to(TU.parent), round(os.path.getsize(sciezka) / 1024), 'KB')


def podglad(html):
    """Wersja pod /podglad/: poza wyszukiwarkami i z notatkami dla właściciela (klasa „podglad”)."""
    return (html.replace('<html lang="pl">', '<html lang="pl" class="podglad">', 1)
            .replace('<meta name="viewport"', '<meta name="robots" content="noindex, nofollow">\n<meta name="viewport"', 1))


fonty, preload = czcionki_z_serwera()
zrodlo = open(TU / 'index.src.html', encoding='utf8').read()
wspolne = czesci_wspolne(zrodlo)
strona = twarde_spacje(wstaw(bez_znacznikow(zrodlo), fonty, preload))

polityka = open(TU / 'polityka-prywatnosci.src.html', encoding='utf8').read()
for nazwa, tresc in wspolne.items():
    polityka = polityka.replace(f'%%WSPOLNE:{nazwa}%%', tresc)
polityka = twarde_spacje(wstaw(polityka, fonty, preload))
assert '%%' not in strona and '%%' not in polityka, 'został niepodmieniony znacznik %%…%%'

if TRWAJA_PRACE:
    zapisz(PUB / 'index.html', wstaw(open(TU / 'prace.src.html', encoding='utf8').read(), czcionki_wklejone()))
    zapisz(PUB / 'podglad' / 'index.html', podglad(strona))
    zapisz(PUB / 'podglad' / 'polityka-prywatnosci' / 'index.html', podglad(polityka))
    shutil.rmtree(PUB / 'polityka-prywatnosci', ignore_errors=True)
else:
    zapisz(PUB / 'index.html', strona)
    zapisz(PUB / 'polityka-prywatnosci' / 'index.html', polityka)
    shutil.rmtree(PUB / 'podglad', ignore_errors=True)
