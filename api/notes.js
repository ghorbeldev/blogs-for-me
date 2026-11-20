const crypto = require('crypto');
const { GITHUB_TOKEN: T, GITHUB_REPO: R, GITHUB_BRANCH: B = 'main', APP_PASSWORD: P } = process.env;

const gh = async (path, opts = {}) => {
  const r = await fetch('https://api.github.com/repos/' + R + path, {
    ...opts,
    headers: { Authorization: 'Bearer ' + T, Accept: 'application/vnd.github+json', 'User-Agent': 'notes-app', 'Content-Type': 'application/json' },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.message || r.statusText), { status: r.status });
  return j;
};
const authed = (s) => {
  const a = Buffer.from(String(s || '')), b = Buffer.from(P || '');
  return !!P && a.length === b.length && crypto.timingSafeEqual(a, b);
};
const safe = (p) => typeof p === 'string' && /^notes\/[^\\]+\.md$/.test(p) && !p.includes('..');
const url = (p) => '/contents/' + p.split('/').map(encodeURIComponent).join('/');

module.exports = async (req, res) => {
  try {
    if (!authed(req.headers['x-password'])) return res.status(401).json({ error: 'Wrong password' });

    if (req.method === 'GET') {
      const tree = await gh('/git/trees/' + encodeURIComponent(B) + '?recursive=1');
      const files = tree.tree.filter((x) => x.type === 'blob' && safe(x.path));
      const out = [];
      for (let i = 0; i < files.length; i += 10) {
        await Promise.all(files.slice(i, i + 10).map(async (x) => {
          const b = await gh('/git/blobs/' + x.sha);
          out.push({ path: x.path, sha: x.sha, content: Buffer.from(b.content, 'base64').toString('utf8') });
        }));
      }
      return res.json(out);
    }

    const { path, content, sha, message } = req.body || {};
    if (!safe(path)) return res.status(400).json({ error: 'Bad path' });

    if (req.method === 'PUT') {
      const r = await gh(url(path), { method: 'PUT', body: JSON.stringify({
        message: message || 'Update ' + path,
        content: Buffer.from(String(content), 'utf8').toString('base64'),
        branch: B, ...(sha ? { sha } : {}),
      }) });
      return res.json({ sha: r.content.sha });
    }
    if (req.method === 'DELETE') {
      await gh(url(path), { method: 'DELETE', body: JSON.stringify({ message: 'Delete ' + path, sha, branch: B }) });
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};
