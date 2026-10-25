// «Yurist va Kadr» — sayt arizalari va savollarini Telegram botga yuboradi (Vercel funksiyasi).
// Sozlamalar Vercel → Project → Settings → Environment Variables boʻlimida:
//   BOT_TOKEN — @BotFather bergan token
//   CHAT_IDS  — xabar boradigan chat ID (bir nechta boʻlsa vergul bilan)

const ALLOWED = ['Onlayn kurs', 'Oflayn kurs (9 kun)', 'Shanba va yakshanbalik kurs', 'Xarid faoliyati kursi', 'Qayta qoʻngʻiroq', 'Tashkilot xodimlari uchun oʻquv', 'Hali tanlamadim, maslahat kerak'];

const clean = (v, max) => String(v ?? '').trim().replace(/[\x00-\x1F\x7F]/g, ' ').slice(0, max);
const h = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function nowTashkent() {
  const d = new Date(Date.now() + 5 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export default async function handler(req, res) {
  const reply = (code, ok, message = '') => res.status(code).json({ ok, message });
  if (req.method !== 'POST') return reply(405, false, 'Faqat POST');

  const TOKEN = process.env.BOT_TOKEN || '';
  const CHATS = (process.env.CHAT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!TOKEN || !CHATS.length) return reply(500, false, 'BOT_TOKEN yoki CHAT_IDS sozlanmagan');

  let data = req.body;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = null; } }
  if (!data || typeof data !== 'object') return reply(400, false, 'Notoʻgʻri soʻrov');
  if (data.website) return reply(200, true); // spam-tuzoq

  const isQuestion = data.type === 'question';
  const name = clean(data.name, 100);
  if (name.length < 2) return reply(422, false, 'Ism kiritilmagan');

  let text;
  if (isQuestion) {
    let contact = clean(data.contact, 60);
    const question = clean(data.question, 1000);
    const isUser = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(contact);
    const digits = contact.replace(/\D/g, '');
    if (!isUser && (digits.length < 9 || digits.length > 15)) return reply(422, false, 'Aloqa maʼlumoti notoʻgʻri');
    if (isUser && contact[0] !== '@') contact = '@' + contact;
    if (question.length < 10) return reply(422, false, 'Savol juda qisqa');
    text = `❓ <b>Saytdan yangi savol</b>\n\n👤 <b>Ism:</b> ${h(name)}\n📱 <b>Aloqa:</b> ${h(contact)}\n\n💬 ${h(question)}\n\n🕒 ${nowTashkent()}`;
  } else {
    const phone = clean(data.phone, 30);
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) return reply(422, false, 'Telefon raqam notoʻgʻri');
    let format = clean(data.format, 80);
    if (!ALLOWED.includes(format)) format = 'Koʻrsatilmagan';
    const role = clean(data.role, 100);
    const question = clean(data.question, 300);
    text = `🆕 <b>Saytdan yangi ariza</b>\n\n👤 <b>Ism:</b> ${h(name)}\n📞 <b>Telefon:</b> ${h(phone)}\n🎓 <b>Format:</b> ${h(format)}\n` +
      (role ? `💼 <b>Lavozim:</b> ${h(role)}\n` : '') +
      (question ? `❓ <b>Savol:</b> ${h(question)}\n` : '') +
      `\n🕒 ${nowTashkent()}`;
  }

  let sentAny = false;
  for (const chat_id of CHATS) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      const j = await r.json();
      if (j.ok) sentAny = true;
    } catch { /* keyingi chatga o‘tamiz */ }
  }
  if (!sentAny) return reply(502, false, 'Telegramga yuborib boʻlmadi');
  return reply(200, true, 'Qabul qilindi');
}
