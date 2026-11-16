// Yopiq (Private) Blob omboridagi galereya rasmini koʻrsatadi: /api/rasm?p=gallery/....jpg
import { readImage } from './_gallery.js';

export default async function handler(req, res) {
  const r = await readImage(String(req.query.p || ''));
  if (!r) return res.status(404).end();
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
  return res.status(200).send(Buffer.from(await new Response(r.stream).arrayBuffer()));
}
