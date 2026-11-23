// Odbiera z ElevenLabs informację o zakończonej rozmowie asystenta i wysyła ją na Telegram:
// podsumowanie, najważniejsze dane rozmówcy i pełną transkrypcję.
//
// Ustawienia w Netlify (Project configuration → Environment variables):
//   ELEVENLABS_WEBHOOK_SECRET – sekret pokazany przez ElevenLabs przy tworzeniu webhooka
//   TELEGRAM_BOT_TOKEN        – token bota od @BotFather
//   TELEGRAM_CHAT_ID          – identyfikator czatu, na który mają przychodzić wiadomości
import { createHmac, timingSafeEqual } from 'node:crypto';

export const config = { path: '/api/po-rozmowie' };

const TOLERANCJA_S = 30 * 60;
const LIMIT_TELEGRAM = 3900; // Telegram przyjmuje do 4096 znaków w jednej wiadomości

const ETYKIETY = {
  imie: 'Imię', firma: 'Firma', branza: 'Branża',
  zapytania_miesiecznie: 'Zapytań miesięcznie', wartosc_zlecenia: 'Średnia wartość zlecenia',
  nastepny_krok: 'Następny krok', termin: 'Termin', gotowosc: 'Gotowość do zakupu', obiekcje: 'Obiekcje',
};
const KOLEJNOSC = Object.keys(ETYKIETY);
// ElevenLabs przysyła kryteria oceny tylko z identyfikatorem, bez nazwy. Tu są nazwy kryteriów agenta Kamil – Odzew (pokaz).
// Nowe kryterium pokaże się jako „Kryterium N”, dopóki nie zostanie tu dopisane.
const KRYTERIA = {
  aitem_5901m7zxr4qnffqrg2k8hs5n071t: 'Pokaz w roli',
  aitem_7801m7zxrp0yf2etbwc10tzb4vf3: 'Ustalony następny krok',
  aitem_6801m7zxs5j4fstbsyfwb6n7y2pm: 'Tylko prawdziwe fakty',
};
const ZAKONCZENIA = [[/end_call/i, 'asystent zakończył rozmowę po pożegnaniu'], [/client|user|remote/i, 'rozmówca się rozłączył'], [/timeout|silence|inactiv/i, 'cisza na linii'], [/max.*duration|duration/i, 'przekroczony limit czasu rozmowy']];

export function podpisPoprawny(naglowek, tresc, sekret, teraz = Date.now() / 1000) {
  if (!naglowek || !sekret) return false;
  const czesci = Object.fromEntries(naglowek.split(',').map(c => { const i = c.indexOf('='); return [c.slice(0, i).trim(), c.slice(i + 1).trim()]; }));
  const t = Number(czesci.t);
  if (!t || !czesci.v0 || Math.abs(teraz - t) > TOLERANCJA_S) return false;
  const oczekiwany = createHmac('sha256', sekret).update(`${czesci.t}.${tresc}`).digest('hex');
  const a = Buffer.from(oczekiwany), b = Buffer.from(czesci.v0);
  return a.length === b.length && timingSafeEqual(a, b);
}

const czas = s => { s = Math.round(Number(s) || 0); const m = Math.floor(s / 60); return m ? `${m} min ${s % 60} s` : `${s} s`; };
const data = unix => new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', dateStyle: 'short', timeStyle: 'short' }).format(new Date(unix * 1000));
const wynik = w => ({ success: 'tak', failure: 'nie', unknown: 'nie wiadomo' }[w] || w || 'nie wiadomo');
const pusty = v => v === null || v === undefined || String(v).trim() === '' || /^(null|none|brak|n\/a)$/i.test(String(v).trim());

export function zbudujWiadomosci(d) {
  const meta = d.metadata || {}, analiza = d.analysis || {};
  const zmienne = (d.conversation_initiation_client_data || {}).dynamic_variables || {};
  const numer = (meta.phone_call || {}).external_number || zmienne.system__caller_id || '';
  const naglowek = ['📞 Nowa rozmowa' + (d.agent_name ? ' · ' + d.agent_name : '')];
  const kiedy = [meta.start_time_unix_secs ? data(meta.start_time_unix_secs) : '', meta.call_duration_secs != null ? czas(meta.call_duration_secs) : ''].filter(Boolean).join(' · ');
  if (kiedy) naglowek.push(kiedy);
  naglowek.push(numer ? `Numer rozmówcy: ${numer}` : 'Numer rozmówcy: nieznany (rozmowa z przeglądarki albo numer zastrzeżony)');

  const czesci = [naglowek.join('\n')];
  const podsumowanie = [analiza.call_summary_title, analiza.transcript_summary].filter(v => !pusty(v)).join('\n');
  if (podsumowanie) czesci.push('PODSUMOWANIE\n' + podsumowanie);

  // Wpisy mają klucz-identyfikator (aitem_…) i pole name z nazwą nadaną w panelu, np. „imie”.
  const dane = Object.entries(analiza.data_collection_results || {}).map(([klucz, w]) => ({ nazwa: (w && w.name) || klucz, wartosc: w && w.value }));
  const miejsce = n => { const i = KOLEJNOSC.indexOf(n); return i < 0 ? KOLEJNOSC.length : i; };
  const linie = dane.filter(x => !pusty(x.wartosc)).sort((x, y) => miejsce(x.nazwa) - miejsce(y.nazwa)).map(x => `• ${ETYKIETY[x.nazwa] || x.nazwa}: ${x.wartosc}`);
  if (linie.length) czesci.push('NAJWAŻNIEJSZE\n' + linie.join('\n'));

  const skroc = (t, n = 220) => { t = String(t || '').trim(); return t.length > n ? t.slice(0, n).trimEnd() + '…' : t; };
  const oceny = Object.values(analiza.evaluation_criteria_results || {}).map((o, i) => {
    const nazwa = KRYTERIA[o.criteria_id] || (/^aitem_/.test(o.criteria_id || '') || !o.criteria_id ? `Kryterium ${i + 1}` : o.criteria_id);
    return `• ${nazwa}: ${wynik(o.result)}` + (o.result !== 'success' && o.rationale ? ` (${skroc(o.rationale)})` : '');
  });
  const ocena = [`Rozmowa udana: ${wynik(analiza.call_successful)}`, ...oceny];
  if (meta.termination_reason) { const z = ZAKONCZENIA.find(([w]) => w.test(meta.termination_reason)); ocena.push(`Zakończenie: ${z ? z[1] : meta.termination_reason}`); }
  czesci.push('OCENA\n' + ocena.join('\n'));

  // W transkrypcji agent występuje pod imieniem z nazwy agenta w ElevenLabs („Kamil – Odzew (pokaz)” → „Kamil”).
  const imie = String(d.agent_name || '').split(/\s[–-]\s/)[0].trim() || 'Asystent';
  const rozmowa = (d.transcript || []).filter(w => !pusty(w.message)).map(w => `${w.role === 'agent' ? imie : 'Rozmówca'}: ${String(w.message).trim()}`);
  czesci.push(rozmowa.length ? 'TRANSKRYPCJA\n' + rozmowa.join('\n') : 'TRANSKRYPCJA\n(brak wypowiedzi, rozmówca się rozłączył)');
  if (d.conversation_id) czesci.push(`Identyfikator rozmowy w ElevenLabs: ${d.conversation_id}`);

  // Dzielenie na wiadomości mieszczące się w limicie Telegrama, po granicach linii.
  const wiadomosci = []; let biezaca = '';
  for (const linia of czesci.join('\n\n').split('\n')) {
    let reszta = linia;
    while (reszta.length > LIMIT_TELEGRAM) { if (biezaca) { wiadomosci.push(biezaca); biezaca = ''; } wiadomosci.push(reszta.slice(0, LIMIT_TELEGRAM)); reszta = reszta.slice(LIMIT_TELEGRAM); }
    if ((biezaca + '\n' + reszta).length > LIMIT_TELEGRAM) { wiadomosci.push(biezaca); biezaca = reszta; }
    else biezaca = biezaca ? biezaca + '\n' + reszta : reszta;
  }
  if (biezaca.trim()) wiadomosci.push(biezaca);
  return wiadomosci.length > 1 ? wiadomosci.map((w, i) => i ? `(${i + 1}/${wiadomosci.length})\n${w}` : w) : wiadomosci;
}

export async function wyslijNaTelegram(token, czat, teksty, pobierz = fetch) {
  for (const text of teksty) {
    const r = await pobierz(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: czat, text, disable_web_page_preview: true }),
    });
    if (!r.ok) throw new Error(`Telegram odpowiedział kodem ${r.status}`);
  }
}

export default async function obsluz(req) {
  if (req.method !== 'POST') return new Response('Ten adres przyjmuje tylko zgłoszenia z ElevenLabs.', { status: 405 });
  const { ELEVENLABS_WEBHOOK_SECRET: sekret, TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: czat } = process.env;
  if (!sekret || !token || !czat) { console.error('Brak ustawień: ELEVENLABS_WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN albo TELEGRAM_CHAT_ID'); return new Response('Brak konfiguracji', { status: 500 }); }
  const tresc = await req.text();
  if (!podpisPoprawny(req.headers.get('elevenlabs-signature'), tresc, sekret)) return new Response('Zły podpis', { status: 401 });
  let zdarzenie;
  try { zdarzenie = JSON.parse(tresc); } catch { return new Response('Zła treść', { status: 400 }); }
  if (zdarzenie.type !== 'post_call_transcription') return new Response('Pominięto', { status: 200 });
  try {
    await wyslijNaTelegram(token, czat, zbudujWiadomosci(zdarzenie.data || {}));
  } catch (e) { console.error(e.message); return new Response('Nie udało się wysłać na Telegram', { status: 502 }); }
  return new Response('OK', { status: 200 });
}
