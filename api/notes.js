const crypto = require('crypto');
const find = (re) => {
  const k = Object.keys(process.env).find((k) => re.test(k) && !/READ_ONLY/.test(k));
  return k ? process.env[k] : undefined;
};
// Works with any prefix Vercel gives the variables (KV_, STORAGE_, UPSTASH_REDIS_ ...)
const URL_ = find(/(REST_API_URL|REDIS_REST_URL)$/);
const TOKEN = find(/(REST_API_TOKEN|REDIS_REST_TOKEN)$/);
const P = process.env.APP_PASSWORD;

const redis = async (cmd) => {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || r.statusText);
  return j.result;
};
const authed = (s) => {
  const a = Buffer.from(String(s || '')), b = Buffer.from(P || '');
  return !!P && a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = async (req, res) => {
  try {
    if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Database is not connected: ' + (!URL_ ? 'REST URL' : 'REST token') + ' variable not found. Redeploy after connecting the database.' });
    if (!authed(req.headers['x-password'])) return res.status(401).json({ error: 'Wrong password' });

    if (req.method === 'GET') {
      const raw = await redis(['HGETALL', 'notes']);
      const vals = Array.isArray(raw) ? raw.filter((_, i) => i % 2) : Object.values(raw || {});
      const out = [];
      for (const v of vals) { try { out.push(JSON.parse(v)); } catch (e) {} }
      return res.json(out);
    }
    if (req.method === 'PUT') {
      const n = (req.body || {}).note || {};
      if (typeof n.id !== 'string' || !/^[\w-]{1,40}$/.test(n.id) || typeof n.title !== 'string' || typeof n.body !== 'string')
        return res.status(400).json({ error: 'Bad note' });
      if (n.body.length > 400000) return res.status(413).json({ error: 'Note too large' });
      const note = {
        id: n.id, title: n.title.slice(0, 200), folder: String(n.folder || '').slice(0, 200),
        tags: Array.isArray(n.tags) ? n.tags.map(String).slice(0, 50) : [],
        body: n.body, updated: Number(n.updated) || Date.now(), pinned: !!n.pinned,
      };
      await redis(['HSET', 'notes', note.id, JSON.stringify(note)]);
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const id = (req.body || {}).id;
      if (typeof id !== 'string') return res.status(400).json({ error: 'Bad id' });
      await redis(['HDEL', 'notes', id]);
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
