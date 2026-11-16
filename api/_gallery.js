// Guruh rasmlari roʻyxati (Vercel Blob omborida gallery/index.json faylida saqlanadi).
import { put, get, del } from '@vercel/blob';

const INDEX = 'gallery/index.json';
const KEEP = 60;

async function putAny(pathname, body, contentType) {
  // Ombor «Public» yoki «Private» boʻlishi mumkin — ikkalasida ham ishlaydi
  const opts = { addRandomSuffix: false, allowOverwrite: true, contentType, cacheControlMaxAge: 60 };
  try { return { ...(await put(pathname, body, { ...opts, access: 'public' })), access: 'public' }; }
  catch (e) { return { ...(await put(pathname, body, { ...opts, access: 'private' })), access: 'private' }; }
}

export async function readIndex() {
  for (const access of ['public', 'private']) {
    try {
      const r = await get(INDEX, { access, useCache: false });
      if (!r) continue;
      const txt = await new Response(r.stream).text();
      return JSON.parse(txt);
    } catch (e) { /* keyingisini sinaymiz */ }
  }
  return { photos: [] };
}

export async function addPhoto(item, bytes) {
  const saved = await putAny(item.path, bytes, 'image/jpeg');
  item.img = saved.access === 'public' ? saved.url : '/api/rasm?p=' + encodeURIComponent(item.path);
  const idx = await readIndex();
  idx.photos = [item, ...idx.photos.filter((p) => p.id !== item.id)].slice(0, KEEP);
  await putAny(INDEX, JSON.stringify(idx), 'application/json');
  return item;
}

export async function removePhoto(id) {
  const idx = await readIndex();
  const gone = idx.photos.filter((p) => p.id === id);
  if (!gone.length) return false;
  idx.photos = idx.photos.filter((p) => p.id !== id);
  await putAny(INDEX, JSON.stringify(idx), 'application/json');
  for (const p of gone) { try { await del(p.path); } catch (e) { /* fayl allaqachon yoʻq */ } }
  return true;
}

export async function readImage(pathname) {
  if (!/^gallery\/[\w.-]+\.jpg$/.test(pathname)) return null;
  for (const access of ['public', 'private']) {
    try { const r = await get(pathname, { access }); if (r) return r; } catch (e) { /* keyingisi */ }
  }
  return null;
}
