# RxEase launch audit

This audit covers rxease.store and the public rxease-voice-hackathon repository. RxEase is a static HTML, CSS, and JavaScript hackathon demo on Cloudflare Workers with one synthetic case per browser. It has no production identity, server-side patient records, accounts, passwords, database, email, or clinical APIs. Demo role switching is part of the demonstration. **The deployment is for synthetic data only.**

✅ Verified or implemented in the stated scope. ❌ Incomplete or requires external access or a different architecture. N/A identifies a control with no corresponding feature.

## Security checklist, in request order

| # | Status | Exact files and result |
| --- | --- | --- |
| 1 | ✅ | No application credential found. No secret moved. The browser storage identifier and demo verification code are deliberately public. See #18. |
| 2 | ✅ | `.gitignore` ignores `.env` and `.env.*`. Removed the obsolete `.env.example`. `worker.js` restricts assets and `tests/public.cjs` verifies env files return 404. |
| 3 | ✅ / N/A | `worker.js`, `nginx.conf`, `tests/public.cjs`. `/admin` returns 404. The public Administrator demo role is part of the workspace and is not an authenticated production role. |
| 4 | ❌ | No files changed for production authentication. A real deployment must use a verified server-side session, protected endpoints, and role checks. The demo role picker does not provide those controls. |
| 5 | ❌ / N/A | No user-record API or database exists and no server credentials are issued. Browser storage is separate across browser contexts, but is not per-user authorization. No files changed for RLS. |
| 6 | ❌ / N/A | `worker.js` accepts GET and HEAD and has no write endpoints. Existing client-side validation in `web/app.js` covers fictional names, demo codes, signed prescriptions, dispense amounts, uploads and dates. Real form submission would require server-side schemas and validation. |
| 7 | ✅ | `web/_headers`, `web/page-search.js`, `web/404.html`. CSP confines scripts to this origin and forbids framing, objects, base URL changes, and HTML form navigation. User strings render through DOM text nodes. The 404 search filters existing links without interpolating HTML. |
| 8 | N/A | No login, signup, reset email, contact submission, or data API. No application rate limit added. Rate limits would be needed for future live write endpoints. |
| 9 | ✅ / N/A | `worker.js`, `tests/public.cjs`. Explicit static route and method allowlists. Missing routes receive generic 404s and other methods return 405 with Allow. No protected API exists to authenticate. |
| 10 | ✅ | `worker.js`, `tests/public.cjs`. No cross-origin grant or credentials header. Untrusted-Origin response checks passed. Static public content remains public. |
| 11 | ✅ | `web/_headers`, `tests/public.cjs`. Verified CSP, HSTS, nosniff, DENY, Referrer-Policy and Permissions-Policy on the published HTML pages. Camera, microphone and geolocation are disabled for page code. The installed external dictation client can type into the focused input. |
| 12 | ✅ | `worker.js`, `nginx.conf`, `tests/public.cjs`. Public route allowlist excludes debug URLs and source maps. Errors return generic HTML or plain text. |
| 13 | ✅ | No package files changed. npm audit reported 0 advisories before and after. Playwright and jsQR are development-only and both used. The app ships a vendored QR generator with its MIT notice and no npm runtime bundle. npm audit does not assess vendored code, the Nginx image, or Cloudflare. |
| 14 | ✅ / limited | Removed the empty `.env.example`. `worker.js` and `.dockerignore` keep tests, repository docs and submission assets off the public site. The synthetic report is an active lab demo fixture and remains available. |
| 15 | ✅ | `worker.js`, `nginx.conf`, `tests/public.cjs`. Checked env names, Git path, backup files, upload/private/test prefixes, README, framework path and source maps return 404. |
| 16 | N/A | No database, database credentials, or SQL queries. No files changed. |
| 17 | N/A | No passwords or production sign-in. The sample verification code grants no access to real records. No password resets are needed. |
| 18 | ✅ | `.gitleaks.toml`, `.github/workflows/verify.yml`. Ran a redacted Gitleaks scan on all available Git refs and the web tree. Reviewed the single historical match at `8b0d700:web/app.js:4`: it is the local browser storage identifier. Added a path- and value-specific exception and a CI scan. |
| 19 | ✅ / limited | `tests/public.cjs` and the existing `tests/journey.cjs` provide defensive verification. See results below. Production controls in #4–6 remain open. |

| Requested final security check | Result |
| --- | --- |
| Access production admin as a normal visitor | PASS for route exposure. Public `/admin` is 404. Production role authorization is not represented by demo role switching. |
| Access another user by changing an ID | N/A. No account or record-fetch endpoint exists. |
| Stored and reflected XSS | PASS for reviewed output sinks and enforced CSP. Attacker payload execution was not exercised. |
| SQL injection in search or login | N/A. Search filters a list in the browser, and there is no SQL or login handler. |
| Call API without token | PASS for route exposure. Public `/api` is 404 and unavailable methods return 405. No business API exists. |
| Brute-force login | N/A. There is no login endpoint or production credential to guess. |

**The scans found no credentials to rotate.** The historical hit was a browser storage key. The secret scan scope covers Git and the public web assets.

## Post-launch checklist, in request order

| # | Status | Exact files and verification |
| --- | --- | --- |
| 1 | ❌ | Search Console ownership requires the domain owner’s token or account access. No verification code was supplied. |
| 2 | ✅ / ❌ | `worker.js`, `tests/public.cjs`. Dynamic XML sitemap includes both indexable URLs. Submission in Search Console requires ownership. [Sitemap](https://rxease.store/sitemap.xml) |
| 3 | ✅ | `web/robots.txt`, `tests/public.cjs`. Allows indexable URLs, disallows the requested prefixes, and references the XML sitemap. [Robots](https://rxease.store/robots.txt) |
| 4 | ❌ | No GA4 ID or account access was supplied. Analytics remain off. |
| 5 | ❌ | No contact, WhatsApp, or call control exists. Demo CTA tracking requires GA4 and consent configuration. |
| 6 | ✅ | `web/style.css`, `web/app.js`. Full five-role Chromium tests passed at 360, 390, 768 and 1024 pixels, including overflow and label overlap checkpoints. |
| 7 | ❌ / limited | Google PageSpeed API returned HTTP 429 for mobile and desktop. Lighthouse ran both profiles. The site has no in-page hero images or external fonts. `web/index.html` preloads the two app modules, and `web/og-image.jpg` is a 42 KB share asset. |
| 8 | ✅ | `web/app.js`, `web/index.html`, `web/style.css`, `web/favicon.ico`. Fixed heading hierarchy and supplied a favicon. See measured mobile and desktop scores below. |
| 9 | ✅ | `web/index.html`, `web/privacy-policy.html`. Unique titles and descriptions within the requested ranges on both indexable pages. |
| 10 | ✅ | `web/index.html`, `web/privacy-policy.html`, `tests/public.cjs`. Self-referencing canonicals; the error page is marked noindex. |
| 11 | ❌ / N/A | No contact form, recipient address or delivery provider. Synthetic case forms stay local. |
| 12 | ❌ | Bing verification token and account access were not supplied. |
| 13 | ✅ | Public repository updated. `.gitignore`, `README.md` and Gitleaks protect the workflow and document setup. [Repository](https://github.com/Hassansyed21/rxease-voice-hackathon) |
| 14 | ❌ / N/A | No public write endpoint or mail form. The local synthetic forms do not transmit entries. No CAPTCHA provider values supplied. |
| 15 | ✅ | `web/og-image.jpg`, `web/index.html`, `web/privacy-policy.html`, `tests/public.cjs`. Verified 1200×630 JPEG and Open Graph metadata on both pages. [Share image](https://rxease.store/og-image.jpg) |
| 16 | ✅ / ❌ | `web/index.html`. Organization and WebSite JSON-LD. No confirmed brand-owned social URLs were supplied for sameAs. |
| 17 | ✅ / ❌ | `web/privacy-policy.html`, `web/index.html`, `web/style.css`, `worker.js`. Published and linked policy. No optional tracking or cookies, so no consent banner has been added. A future GA4 rollout needs opt-in gating before the first request. [Privacy policy](https://rxease.store/privacy-policy) |
| 18 | ✅ | `web/404.html`, `web/page-search.js`, `web/style.css`, `worker.js`, `nginx.conf`, `tests/public.cjs`. Branded 404 includes local search, public links and a home action. [Test URL](https://rxease.store/this-page-does-not-exist) |
| 19 | ✅ | `web/favicon.ico`, `web/icons/icon-16.png`, `web/icons/icon-32.png`, `web/icons/apple-touch-icon.png`, `web/icons/icon-192.png`, `web/icons/icon-512.png`, `web/site.webmanifest`, `web/index.html`. Live icon and manifest requests return 200. |
| 20 | ✅ / limited | `worker.js`, `tests/public.cjs`. Existing URL aliases have 301s. No old domain or migration map was supplied. |

| Old URL | Canonical URL | Status |
| --- | --- | --- |
| `/index.html` | `/` | 301 |
| `/privacy-policy.html` | `/privacy-policy` | 301 |
| `/privacy-policy/` | `/privacy-policy` | 301 |
| `http://rxease.store/` | `https://rxease.store/` | 308 |

## Measured results

Lighthouse 13.6 lab runs against the published homepage.

| Profile | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Mobile before → after | 100 → 100 | 98 → 100 | 96 → 100 | 100 → 100 |
| Desktop before → after | 100 → 100 | 98 → 100 | 96 → 100 | 100 → 100 |

The remaining network dependency tree diagnostic identifies the app module relationships. All four category scores are 100 in these runs. Google PageSpeed was rate limited for both profiles.

The live five-role journey passed at 360, 390, 768 and 1024 pixels. Wrangler and Cloudflare public-route checks passed. Both published HTML pages delivered the six requested security headers. Public checks covered safe ordinary requests and literal text rendering.

The submission video is 169.8 seconds. It contains H.264 video and AAC narration with no caption track or overlaid captions. Narration was generated with the adult male Indian English Pocket TTS model and synchronized to the existing recordings of the working demo.

## Owner account steps

1. In [Google Search Console](https://search.google.com/search-console), add a **Domain** property for `rxease.store`. Copy its generated TXT value. In Cloudflare DNS, add that TXT record at the root (`@`), then select **Verify** in Search Console. Under **Sitemaps**, submit `https://rxease.store/sitemap.xml`.
2. In [Bing Webmaster Tools](https://www.bing.com/webmasters/), import the verified property from Search Console or add the site and select HTML meta verification. Copy the issued `msvalidate.01` content value for the home page. Verify ownership and submit the same sitemap.
3. In [Google Analytics](https://analytics.google.com/), create or select a property. Under **Admin → Data streams → Web**, add `https://rxease.store` and share the public `G-…` Measurement ID. Decide whether to track the demo start action. If approved, gate the analytics script and requests behind explicit consent and exclude names, transcripts, reports and tokens from events.
4. Supply only actual brand-owned social URLs if sameAs is desired. A contact form or CAPTCHA would require a real mail destination, service configuration, and server-side validation. Keep private provider keys in the hosting secret store.

Real patient information requires separate authenticated server-side storage, per-record authorization, audit trails, and operational review before use.

## Reproduce locally

```sh
npm ci
npx playwright install chromium
npx wrangler dev --port 3084
```

In a second terminal:

```sh
RXEASE_URL=http://localhost:3084/ npm test
RXEASE_URL=http://localhost:3084/ node tests/public.cjs
npm audit
gitleaks git --redact --log-opts=--all
gitleaks dir --config .gitleaks.toml --redact web
```

The public route test requires the Worker. Docker Compose also serves the browser demo and privacy page. The Lighthouse and live Chromium run use the cloud runner’s certificate exception for its testing proxy. Separate HTTP header checks use curl’s configured trust.
