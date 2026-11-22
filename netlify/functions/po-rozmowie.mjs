// Odbiera z ElevenLabs informację o zakończonej rozmowie Oli i wysyła ją na Telegram:
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
  const naglowek = ['📞 Nowa rozmowa Oli'];
  const kiedy = [meta.start_time_unix_secs ? data(meta.start_time_unix_secs) : '', meta.call_duration_secs != null ? czas(meta.call_duration_secs) : ''].filter(Boolean).join(' · ');
  if (kiedy) naglowek.push(kiedy);
  naglowek.push(numer ? `Numer rozmówcy: ${numer}` : 'Numer rozmówcy: nieznany (rozmowa z przeglądarki albo numer zastrzeżony)');

  const czesci = [naglowek.join('\n')];
  const podsumowanie = [analiza.call_summary_title, analiza.transcript_summary].filter(v => !pusty(v)).join('\n');
  if (podsumowanie) czesci.push('PODSUMOWANIE\n' + podsumowanie);

  const dane = analiza.data_collection_results || {};
  const klucze = [...KOLEJNOSC.filter(k => k in dane), ...Object.keys(dane).filter(k => !KOLEJNOSC.includes(k))];
  const linie = klucze.filter(k => !pusty(dane[k] && dane[k].value)).map(k => `• ${ETYKIETY[k] || k}: ${dane[k].value}`);
  if (linie.length) czesci.push('NAJWAŻNIEJSZE\n' + linie.join('\n'));

  const oceny = Object.values(analiza.evaluation_criteria_results || {}).map(o => `• ${o.criteria_id || 'kryterium'}: ${wynik(o.result)}`);
  const ocena = [`Rozmowa udana: ${wynik(analiza.call_successful)}`, ...oceny];
  if (meta.termination_reason) ocena.push(`Zakończenie: ${meta.termination_reason}`);
  czesci.push('OCENA\n' + ocena.join('\n'));

  const rozmowa = (d.transcript || []).filter(w => !pusty(w.message)).map(w => `${w.role === 'agent' ? 'Ola' : 'Rozmówca'}: ${String(w.message).trim()}`);
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
  // Tymczasowa diagnostyka: sama budowa pól analizy (nazwy pól i krótkie wartości), bez transkrypcji.
  try {
    const skroc = v => typeof v === 'string' ? (v.length > 60 ? v.slice(0, 60) + '…' : v) : v;
    const szkielet = (o, g = 0) => o && typeof o === 'object' ? (g > 3 ? '…' : Array.isArray(o) ? o.slice(0, 12).map(x => szkielet(x, g + 1)) : Object.fromEntries(Object.entries(o).map(([k, v]) => [k, szkielet(v, g + 1)]))) : skroc(o);
    const an = (zdarzenie.data || {}).analysis || {};
    console.log('BUDOWA_ANALIZY ' + JSON.stringify(szkielet(Object.fromEntries(Object.entries(an).filter(([k]) => k !== 'transcript_summary')))));
    console.log('POLA_DANYCH ' + JSON.stringify(Object.keys(zdarzenie.data || {})));
  } catch (e) { console.error('diagnostyka', e.message); }
  try {
    await wyslijNaTelegram(token, czat, zbudujWiadomosci(zdarzenie.data || {}));
  } catch (e) { console.error(e.message); return new Response('Nie udało się wysłać na Telegram', { status: 502 }); }
  return new Response('OK', { status: 200 });
}
