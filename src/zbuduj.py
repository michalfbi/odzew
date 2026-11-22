# Składa public/index.html z src/index.src.html: wkleja czcionki (bez łączenia z Google Fonts) i logo do jednego pliku.
import base64, re, os
import pathlib
TU = pathlib.Path(__file__).resolve().parent
F = str(TU / 'fonty') + '/'
LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
css = ''
for fam, pkg, weights in [('Barlow', 'barlow', [800]), ('Inter', 'inter', [400, 600, 700])]:
    for w in weights:
        for sub, rng in [('latin', LATIN), ('latin-ext', EXT)]:
            b = base64.b64encode(open(f'{F}{pkg}-{sub}-{w}-normal.woff2', 'rb').read()).decode()
            wr = '700 800' if fam == 'Barlow' else str(w)
            css += f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{wr};font-display:swap;src:url(data:font/woff2;base64,{b}) format('woff2');unicode-range:{rng}}}\n"
def logo(name):
    s = open(TU / 'logo' / f'{name}.svg').read()
    return re.sub(r' width="[\d.]+" height="[\d.]+"', '', s, count=1)
src = open(TU / 'index.src.html', encoding='utf8').read()
out = (src.replace('%%FONTS%%', css).replace('%%LOGO_ZOLTE%%', logo('odzew-logo-na-zolte-tlo'))
       .replace('%%LOGO_CIEMNE%%', logo('odzew-logo-na-ciemne-tlo'))
       .replace('%%FAVICON%%', base64.b64encode(open(TU / 'logo' / 'favicon.svg', 'rb').read()).decode()))
WYJ = TU.parent / 'public' / 'index.html'
open(WYJ, 'w', encoding='utf8').write(out)
print('public/index.html', round(os.path.getsize(WYJ) / 1024), 'KB')
