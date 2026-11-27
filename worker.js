const pages = new Set(['/', '/privacy-policy']);
const files = new Set([
  '/app.js', '/prescription.js', '/page-search.js', '/style.css',
  '/vendor/qr.js', '/vendor/LICENSE-QR.txt', '/sample-report.txt',
  '/robots.txt', '/og-image.jpg', '/favicon.ico', '/site.webmanifest',
  '/icons/icon-16.png', '/icons/icon-32.png', '/icons/apple-touch-icon.png',
  '/icons/icon-192.png', '/icons/icon-512.png'
]);
const redirects = new Map([
  ['/index.html', '/'],
  ['/privacy-policy.html', '/privacy-policy'],
  ['/privacy-policy/', '/privacy-policy']
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = redirects.get(url.pathname);
    const upgrade = url.hostname === 'rxease.store' && url.protocol === 'http:';
    if (upgrade || path) {
      if (upgrade) url.protocol = 'https:';
      if (path) url.pathname = path;
      return Response.redirect(url, path ? 301 : 308);
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
      });
    }
    if (url.pathname === '/sitemap.xml') {
      const locations = [...pages].map(page => '<url><loc>https://rxease.store' + page + '</loc></url>');
      return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        locations.join('') + '</urlset>', { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (pages.has(url.pathname) || files.has(url.pathname)) return env.ASSETS.fetch(request);
    const errorPage = await env.ASSETS.fetch(new Request(new URL('/404', url), { method: request.method }));
    return new Response(errorPage.body, { status: 404, headers: errorPage.headers });
  }
};
