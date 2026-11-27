const assert = require('node:assert/strict');
const base = new URL(process.env.RXEASE_URL || 'http://127.0.0.1:3084/');
const get = (path, options = {}) => fetch(new URL(path, base), { redirect: 'manual', ...options });

(async () => {
  for (const [path, title] of [['/', 'Patient workspace'], ['/privacy-policy', 'Privacy policy']]) {
    const res = await get(path, { headers: { Origin: 'https://untrusted.invalid' } });
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.match(res.headers.get('permissions-policy'), /geolocation=\(\)/);
    if (base.protocol === 'https:') assert.match(res.headers.get('strict-transport-security'), /max-age=31536000/);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
    assert.equal(res.headers.get('access-control-allow-credentials'), null);
    const html = await res.text();
    assert.ok(html.includes(title), path);
    assert.ok(html.includes('rel="canonical" href="https://rxease.store' + path + '"'), path);
    assert.ok(html.includes('property="og:image" content="https://rxease.store/og-image.jpg"'), path);
  }

  for (const path of ['/this-page-does-not-exist', '/admin', '/api', '/debug', '/.env', '/.env.local',
    '/.env.production', '/.git', '/backup.zip', '/backup.sql', '/uploads', '/private', '/test',
    '/README.md', '/_next', '/app.js.map']) {
    const res = await get(path);
    assert.equal(res.status, 404, path);
    assert.match(await res.text(), /Page not found/);
  }
  const rejected = await get('/', { method: 'OPTIONS' });
  assert.equal(rejected.status, 405);
  assert.equal(rejected.headers.get('allow'), 'GET, HEAD');
  assert.equal(rejected.headers.get('access-control-allow-origin'), null);

  for (const [path, target] of [['/index.html', '/'], ['/privacy-policy.html', '/privacy-policy'], ['/privacy-policy/', '/privacy-policy']]) {
    const res = await get(path);
    assert.equal(res.status, 301, path);
    assert.equal(new URL(res.headers.get('location'), base).pathname, target);
  }
  const sitemap = await get('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('content-type'), /application\/xml/);
  assert.deepEqual(Array.from((await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g), match => match[1]),
    ['https://rxease.store/', 'https://rxease.store/privacy-policy']);
  const robots = await get('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: https:\/\/rxease\.store\/sitemap\.xml/);
  for (const path of ['/og-image.jpg', '/favicon.ico', '/site.webmanifest', '/icons/icon-16.png',
    '/icons/icon-32.png', '/icons/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png']) {
    const res = await get(path, { method: 'HEAD' });
    assert.equal(res.status, 200, path);
  }
  console.log('Passed public route, HTTPS header, CORS, 404, redirect, and metadata checks for ' + base.origin);
})().catch(error => { console.error(error); process.exitCode = 1; });
