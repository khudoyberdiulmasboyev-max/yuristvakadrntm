// Telegram guruhidan rasmlarni saytning «Markaz hayoti» galereyasiga qoʻshadi (Vercel funksiyasi).
//
// Qoidalar (guruhda):
//   • Rasm izohida #sayt boʻlsa — rasm saytga chiqadi. Izohdagi qolgan matn rasm ostiga yoziladi.
//   • Saytdagi rasmni olib tashlash: oʻsha rasm xabariga javob qilib #ochir yozing.
//   • /id — guruh ID raqamini koʻrsatadi (sozlash uchun).
//
// Vercel → Settings → Environment Variables:
//   GALLERY_BOT_TOKEN — rasmlar uchun alohida bot tokeni
//   TG_HOOK_SECRET    — oʻzingiz oʻylab topgan maxfiy soʻz (lotin harf va raqamlar)
//   GROUP_CHAT_IDS    — rasmlar qabul qilinadigan guruh ID raqami (bir nechta boʻlsa vergul bilan)
//   BLOB_READ_WRITE_TOKEN — Vercel Blob ombori ulanganda oʻzi qoʻshiladi
import { addPhoto, removePhoto } from './_gallery.js';

const TOPICS = [
  { cat: 'sert', label: 'Sertifikat', re: /sertifikat|сертификат/i },
  { cat: 'test', label: 'Yakuniy test', re: /test|тест/i },
  { cat: 'sem', label: 'Seminar', re: /seminar|семинар|trening|тренинг/i },
];
const TAG = /#sayt\b|#сайт/i;
const DEL = /#o.?chir|#ўчир|#учир/i;

async function tg(token, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const TOKEN = process.env.GALLERY_BOT_TOKEN;
  const SECRET = process.env.TG_HOOK_SECRET;
  if (!TOKEN || !SECRET || req.headers['x-telegram-bot-api-secret-token'] !== SECRET) return res.status(401).end();

  let u = req.body;
  if (typeof u === 'string') { try { u = JSON.parse(u); } catch { u = {}; } }
  const m = u.message || u.channel_post || u.edited_message || u.edited_channel_post;
  if (!m || !m.chat) return res.status(200).json({ ok: true });

  const chatId = String(m.chat.id);
  const text = m.caption || m.text || '';
  const allowed = (process.env.GROUP_CHAT_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

  // /id — guruh raqamini aytadi
  if (/^\/id(@\w+)?\b/.test(text)) {
    await tg(TOKEN, 'sendMessage', { chat_id: m.chat.id, reply_to_message_id: m.message_id,
      text: `Guruh ID: ${chatId}\nUni Vercel'da GROUP_CHAT_IDS sozlamasiga yozing.` });
    return res.status(200).json({ ok: true });
  }
  if (!allowed.includes(chatId)) return res.status(200).json({ ok: true });

  try {
    // #ochir — javob berilgan rasmni saytdan olib tashlash
    if (DEL.test(text) && m.reply_to_message) {
      const id = `${chatId}_${m.reply_to_message.message_id}`;
      const ok = await removePhoto(id);
      await tg(TOKEN, 'setMessageReaction', { chat_id: m.chat.id, message_id: m.message_id, reaction: [{ type: 'emoji', emoji: ok ? '👌' : '🤷' }] });
      return res.status(200).json({ ok: true });
    }

    if (!m.photo || !TAG.test(text)) return res.status(200).json({ ok: true });

    // Eng katta, lekin 1600 pikseldan oshmaydigan oʻlchamni olamiz
    const sizes = [...m.photo].sort((a, b) => a.width - b.width);
    const best = sizes.filter((s) => Math.max(s.width, s.height) <= 1600).pop() || sizes[0];
    const f = await tg(TOKEN, 'getFile', { file_id: best.file_id });
    if (!f.ok) throw new Error('getFile');
    const img = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${f.result.file_path}`);
    if (!img.ok) throw new Error('download');
    const bytes = Buffer.from(await img.arrayBuffer());

    const caption = text.replace(TAG, '').replace(/\s+/g, ' ').trim().slice(0, 120);
    const topic = TOPICS.find((t) => t.re.test(caption)) || { cat: 'dars', label: 'Dars jarayoni' };
    const id = `${chatId}_${m.message_id}`;
    await addPhoto({
      id, path: `gallery/${id.replace(/[^\w-]/g, '')}.jpg`, cat: topic.cat, label: topic.label, caption,
      date: new Date((m.date || Date.now() / 1000) * 1000).toISOString(), url: '',
    }, bytes);
    await tg(TOKEN, 'setMessageReaction', { chat_id: m.chat.id, message_id: m.message_id, reaction: [{ type: 'emoji', emoji: '👍' }] });
  } catch (e) {
    await tg(TOKEN, 'sendMessage', { chat_id: m.chat.id, reply_to_message_id: m.message_id,
      text: 'Rasmni saytga qoʻshib boʻlmadi. Vercel Blob ombori ulanganini tekshiring.' }).catch(() => {});
  }
  return res.status(200).json({ ok: true });
}
