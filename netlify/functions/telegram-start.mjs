// Jednorazowa pomoc przy konfiguracji: po napisaniu do bota dowolnej wiadomości otwórz
// https://odzew.tech/api/telegram-start, a bot odpisze na Telegramie identyfikatorem czatu.
// Gdy TELEGRAM_CHAT_ID jest już ustawiony, adres niczego nie wysyła.
export const config = { path: '/api/telegram-start' };

const odp = (tekst, status = 200) => new Response(tekst, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

export default async function obsluz() {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: czat } = process.env;
  if (!token) return odp('Najpierw dodaj w Netlify zmienną TELEGRAM_BOT_TOKEN i wdróż stronę ponownie.', 500);
  if (czat) return odp('Powiadomienia są już skonfigurowane. Ten adres nie jest dłużej potrzebny.');
  const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  if (!r.ok) return odp('Telegram odrzucił token bota. Sprawdź, czy TELEGRAM_BOT_TOKEN jest wklejony w całości.', 502);
  const wpisy = ((await r.json()).result || []).map(u => u.message).filter(m => m && m.chat && m.chat.type === 'private');
  if (!wpisy.length) return odp('Bot nie dostał jeszcze żadnej wiadomości. Otwórz bota w Telegramie, naciśnij Start i odśwież tę stronę.', 404);
  const id = wpisy[wpisy.length - 1].chat.id;
  const w = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: id, text: `Identyfikator tego czatu: ${id}\nWpisz go w Netlify jako TELEGRAM_CHAT_ID. Od tej chwili będą tu przychodzić podsumowania rozmów Oli.` }) });
  return w.ok ? odp('Wysłałem identyfikator czatu na Telegram. Sprawdź rozmowę z botem.') : odp('Nie udało się wysłać wiadomości na Telegram.', 502);
}
