// Uruchomienie: node test/po-rozmowie.test.mjs
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import obsluz, { podpisPoprawny, zbudujWiadomosci } from '../netlify/functions/po-rozmowie.mjs';

const sekret = 'wsec_test';
const podpisz = (tresc, t = Math.floor(Date.now() / 1000)) => `t=${t},v0=${createHmac('sha256', sekret).update(`${t}.${tresc}`).digest('hex')}`;
const zdarzenie = (transkrypt) => ({ type: 'post_call_transcription', event_timestamp: 1795346000, data: {
  agent_id: 'agent_x', agent_name: 'Ola – Odzew (sprzedaż)', conversation_id: 'conv_123', status: 'done',
  transcript: transkrypt || [
    { role: 'agent', message: 'Dzień dobry, tu Ola, wirtualna asystentka firmy Odzew.', time_in_call_secs: 0 },
    { role: 'user', message: 'Dzień dobry, mam firmę z oknami w Kielcach.', time_in_call_secs: 6 },
    { role: 'agent', message: null, time_in_call_secs: 9 },
    { role: 'agent', message: 'To proponuję bezpłatny audyt. Wtorek czy środa?', time_in_call_secs: 40 },
  ],
  metadata: { start_time_unix_secs: 1795346000, call_duration_secs: 192, termination_reason: 'end_call tool was called', phone_call: { direction: 'inbound', external_number: '+48600100200', agent_number: '+48412306785' } },
  analysis: { call_successful: 'success', call_summary_title: 'Audyt umówiony na wtorek', transcript_summary: 'Właściciel firmy okiennej umówił audyt.',
    data_collection_results: { aitem_3: { data_collection_id: 'aitem_3', name: 'termin', value: 'wtorek przed południem' }, aitem_1: { name: 'imie', value: 'Tomasz' }, aitem_2: { name: 'firma', value: 'Okna Demo' }, aitem_4: { name: 'obiekcje', value: null }, aitem_5: { name: 'nastepny_krok', value: 'Brak' }, inne_pole: { value: 'x' } },
    evaluation_criteria_results: { aitem_5901m7zxr4qnffqrg2k8hs5n071t: { criteria_id: 'aitem_5901m7zxr4qnffqrg2k8hs5n071t', result: 'success', rationale: 'ok' }, aitem_7801m7zxrp0yf2etbwc10tzb4vf3: { criteria_id: 'aitem_7801m7zxrp0yf2etbwc10tzb4vf3', result: 'failure', rationale: 'Nie ustalono terminu.' }, aitem_nowe: { criteria_id: 'aitem_nowe', result: 'unknown' } } },
  conversation_initiation_client_data: { dynamic_variables: { system__caller_id: '+48600100200' } },
} });

// 1. Podpis
const tresc = JSON.stringify(zdarzenie());
assert.equal(podpisPoprawny(podpisz(tresc), tresc, sekret), true);
assert.equal(podpisPoprawny(podpisz(tresc), tresc + ' ', sekret), false, 'zmieniona treść');
assert.equal(podpisPoprawny(podpisz(tresc), tresc, 'inny'), false, 'zły sekret');
assert.equal(podpisPoprawny(podpisz(tresc, Math.floor(Date.now() / 1000) - 3600), tresc, sekret), false, 'stary znacznik czasu');
assert.equal(podpisPoprawny(null, tresc, sekret), false);
assert.equal(podpisPoprawny('bzdura', tresc, sekret), false);

// 2. Treść wiadomości
const w = zbudujWiadomosci(zdarzenie().data);
assert.equal(w.length, 1);
for (const fragment of ['Numer rozmówcy: +48600100200', '3 min 12 s', 'Audyt umówiony na wtorek', '• Imię: Tomasz', '• Firma: Okna Demo', '• Termin: wtorek przed południem', '• inne_pole: x', 'Rozmowa udana: tak', '• Pokaz w roli: tak', '• Ustalony następny krok: nie (Nie ustalono terminu.)', '• Kryterium 3: nie wiadomo', 'Zakończenie: Ola zakończyła rozmowę po pożegnaniu', '📞 Nowa rozmowa · Ola – Odzew (sprzedaż)', 'Ola: Dzień dobry, tu Ola', 'Rozmówca: Dzień dobry, mam firmę', 'conv_123'])
  assert.ok(w[0].includes(fragment), 'brak: ' + fragment);
assert.ok(!w[0].includes('Obiekcje'), 'puste pole nie powinno się pokazać');
assert.ok(!w[0].includes('aitem_'), 'identyfikatory nie powinny trafiać do wiadomości');
assert.ok(!w[0].includes('Następny krok'), 'wartość „Brak” jest pomijana');
assert.ok(w[0].indexOf('• Imię') < w[0].indexOf('• Termin'), 'kolejność pól');
assert.ok(!w[0].includes('Ola: null'));

// 3. Długa rozmowa dzieli się na części mieszczące się w limicie
const dluga = Array.from({ length: 120 }, (_, i) => ({ role: i % 2 ? 'user' : 'agent', message: `Wypowiedź numer ${i}. ` + 'Lorem ipsum dolor sit amet. '.repeat(5) }));
const wiele = zbudujWiadomosci(zdarzenie(dluga).data);
assert.ok(wiele.length > 1);
assert.ok(wiele.every(x => x.length <= 4096), 'limit Telegrama');
assert.ok(wiele[1].startsWith(`(2/${wiele.length})`));
assert.ok(wiele.join('\n').includes('Wypowiedź numer 119.'));
// Pusta rozmowa
assert.ok(zbudujWiadomosci({ transcript: [] })[0].includes('brak wypowiedzi'));

// 4. Cała funkcja z podmienionym Telegramem
const wyslane = []; let kodTelegrama = 200;
globalThis.fetch = async (url, opcje) => { wyslane.push({ url, body: JSON.parse(opcje.body) }); return { ok: kodTelegrama === 200, status: kodTelegrama }; };
const zadanie = (cialo, naglowki = {}, method = 'POST') => new Request('https://odzew.tech/api/po-rozmowie', { method, headers: naglowki, body: method === 'POST' ? cialo : undefined });

assert.equal((await obsluz(zadanie(tresc, { 'elevenlabs-signature': podpisz(tresc) }))).status, 500, 'bez ustawień');
Object.assign(process.env, { ELEVENLABS_WEBHOOK_SECRET: sekret, TELEGRAM_BOT_TOKEN: '111:AAA', TELEGRAM_CHAT_ID: '4242' });
assert.equal((await obsluz(zadanie('', {}, 'GET'))).status, 405);
assert.equal((await obsluz(zadanie(tresc, { 'elevenlabs-signature': 't=1,v0=00' }))).status, 401);
assert.equal((await obsluz(zadanie(tresc))).status, 401, 'brak podpisu');
assert.equal(wyslane.length, 0, 'bez poprawnego podpisu nic nie wychodzi');
assert.equal((await obsluz(zadanie(tresc, { 'elevenlabs-signature': podpisz(tresc) }))).status, 200);
assert.equal(wyslane.length, 1);
assert.equal(wyslane[0].url, 'https://api.telegram.org/bot111:AAA/sendMessage');
assert.equal(wyslane[0].body.chat_id, '4242');
assert.ok(wyslane[0].body.text.startsWith('📞 Nowa rozmowa'));
const inne = JSON.stringify({ type: 'post_call_audio', data: {} });
assert.equal((await obsluz(zadanie(inne, { 'elevenlabs-signature': podpisz(inne) }))).status, 200);
assert.equal(wyslane.length, 1, 'inne zdarzenia są pomijane');
kodTelegrama = 500;
assert.equal((await obsluz(zadanie(tresc, { 'elevenlabs-signature': podpisz(tresc) }))).status, 502, 'błąd Telegrama daje ponowienie');

console.log('Wszystkie testy przeszły.\n\n--- przykładowa wiadomość ---\n' + w[0]);
