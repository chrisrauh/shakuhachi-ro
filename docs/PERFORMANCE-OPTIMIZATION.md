# Performance Optimization Guide

## Current Performance Baseline

**Test Date:** 2026-02-23
**Page:** Home page (http://localhost:3003/)
**Environment:** Development (Vite dev server)

### Metrics (Current)
- **LCP:** 1,366 ms (Target: < 1,000 ms)
- **TTFB:** 1,028 ms ⚠️ (Target: < 600 ms)
- **Render Delay:** 338 ms
- **CLS:** 0.00 ✅ (Perfect!)

### Critical Path Latency
- **Max:** 1,343 ms (fonts blocking render)

---

## Priority 1: Font Optimization (Est. Savings: 300-500ms)

### Current Issue
```html
<!-- Current: loads 235.8 kB, 1,343ms critical path -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap"
  rel="stylesheet"
/>
```

**Problems:**
1. Loads entire variable font range (100-900 weights = ~80KB per file)
2. 3 separate WOFF2 files downloaded
3. Blocks render despite `display=swap`
4. Chained requests: HTML → CSS → WOFF2

### Solution A: Load Only Needed Weights (Quick Win)

```html
<!-- Only load weights actually used in the app -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
  rel="stylesheet"
/>
```

**Audit which weights are used:**
```bash
# Search CSS for font-weight usage
grep -r "font-weight" src/
```

**Estimated savings:** 150-200 kB, ~200ms

---

### Solution B: Self-Host Fonts (Best Performance)

1. **Download fonts from Google Fonts:**
   - Go to https://fonts.google.com/specimen/Noto+Sans+JP
   - Download only needed weights (400, 500, 700)
   - Place in `/public/fonts/`

2. **Update Layout.astro:**
```html
<!-- Remove Google Fonts -->
<!-- <link href="https://fonts.googleapis.com/..." /> -->

<!-- Add local font loading in CSS -->
```

3. **Create `/src/styles/fonts.css`:**
```css
@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/NotoSansJP-Regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/NotoSansJP-Medium.woff2') format('woff2');
}

@font-face {
  font-family: 'Noto Sans JP';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/NotoSansJP-Bold.woff2') format('woff2');
}
```

4. **Preload critical fonts:**
```html
<head>
  <!-- Preload only the most critical font (Regular 400) -->
  <link
    rel="preload"
    href="/fonts/NotoSansJP-Regular.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />
</head>
```

**Benefits:**
- No external request (fonts served from same origin)
- Only load weights you actually use
- Preload critical fonts
- No chained requests

**Estimated savings:** 300-500ms

---

### Solution C: System Font Stack (Maximum Performance)

Use system fonts instead of custom fonts:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans JP',
  'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
```

**Benefits:**
- Zero font loading time
- No network requests
- Instant render

**Trade-offs:**
- Different fonts on different OSs
- Less brand consistency

**Estimated savings:** 500ms+

---

## Priority 2: Server Response Time (Est. Savings: 400-600ms)

### Current Issue
- **TTFB:** 1,028 ms (75% of LCP time!)
- **No compression** applied
- **Slow dev server** response

### Development Optimizations

#### Enable Compression (Vite/Astro)

Compression is typically only enabled in production builds, but for testing:

```javascript
// astro.config.mjs
export default defineConfig({
  vite: {
    build: {
      // Enable compression in production
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
    },
  },
});
```

**Note:** Dev server intentionally skips compression for faster rebuilds. This is normal.

---

### Production Optimizations

#### 1. Enable Compression at CDN/Host Level

**Netlify (current host):**
- Brotli compression enabled automatically
- Gzip fallback for older browsers
- No configuration needed

Verify in production:
```bash
curl -H "Accept-Encoding: br, gzip" https://shakuhachi.ro -I | grep -i encoding
# Should show: content-encoding: br
```

#### 2. Optimize SSR Performance

If using SSR (Server-Side Rendering):

```javascript
// Reduce work done on server
export async function getStaticPaths() {
  // Pre-generate static pages at build time
  return [
    { params: { slug: 'akatombo' } },
    { params: { slug: 'love-story' } },
  ];
}
```

**Consider:**
- Static Site Generation (SSG) for public pages
- ISR (Incremental Static Regeneration) for frequently changing content
- Client-side data fetching for user-specific data

#### 3. Database Query Optimization

Check if slow queries are causing server delays:

```sql
-- Add indexes for common queries
CREATE INDEX idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_slug ON scores(slug);
```

Verify with Supabase dashboard → Database → Indexes.

---

### Measurement

**Dev:**
```bash
# Slow in dev is expected (no compression, hot reload overhead)
curl -o /dev/null -s -w "Time: %{time_total}s\n" http://localhost:3003/
```

**Production:**
```bash
# Should be < 600ms
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://shakuhachi.ro/
```

---

## Priority 3: JavaScript Optimization (Est. Savings: 200-400ms)

### Current Issue
Deep dependency chains causing sequential module loads:
```
index.js → create-score-handler → scores.ts → supabase.ts
→ @supabase/supabase-js → API request
```

### Solutions

#### 1. Code Splitting

Lazy load non-critical components:

```javascript
// Before: Eager load
import { ScoreLibrary } from '../components/ScoreLibrary';
new ScoreLibrary('score-library');

// After: Lazy load
const loadScoreLibrary = async () => {
  const { ScoreLibrary } = await import('../components/ScoreLibrary');
  new ScoreLibrary('score-library');
};

// Load after page is interactive
if (document.readyState === 'complete') {
  loadScoreLibrary();
} else {
  window.addEventListener('load', loadScoreLibrary);
}
```

#### 2. Preload Critical Modules

```html
<head>
  <!-- Preload Supabase SDK (end of critical chain) -->
  <link
    rel="modulepreload"
    href="/node_modules/.vite/deps/@supabase_supabase-js.js"
  />
</head>
```

#### 3. Bundle Optimization (Vite)

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-lucide': ['lucide'],
        },
      },
    },
  },
});
```

#### 4. Remove Unused Code

Audit and remove unused imports:

```bash
# Find unused exports
npx ts-prune

# Find large dependencies
npx vite-bundle-visualizer
```

---

## Priority 4: Asset Optimization

### Images

1. **Use WebP/AVIF formats:**
```html
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="..." loading="lazy" />
</picture>
```

2. **Lazy load off-screen images:**
```html
<img src="..." loading="lazy" />
```

3. **Use responsive images:**
```html
<img
  src="image-800w.jpg"
  srcset="image-400w.jpg 400w, image-800w.jpg 800w, image-1200w.jpg 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  alt="..."
/>
```

### SVG Optimization

```bash
# Install SVGO
npm install -D svgo

# Optimize SVGs
npx svgo -f public/ -r
```

---

## Priority 5: Caching Strategy

### Static Assets

```javascript
// astro.config.mjs
export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          // Add hashes to filenames for cache busting
          assetFileNames: 'assets/[name].[hash][extname]',
          chunkFileNames: 'chunks/[name].[hash].js',
          entryFileNames: 'entry/[name].[hash].js',
        },
      },
    },
  },
});
```

### Service Worker (Advanced)

For offline support and aggressive caching:

```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/styles/main.css',
        '/fonts/NotoSansJP-Regular.woff2',
      ]);
    })
  );
});
```

---

## Priority 6: API Request Optimization

### Current: Sequential Requests

```javascript
// Bad: Sequential
const user = await authState.getUser();
const scores = await getAllScores();
```

### Optimized: Parallel Requests

```javascript
// Good: Parallel
const [user, scores] = await Promise.all([
  authState.getUser(),
  getAllScores(),
]);
```

### Prefetch Data

```html
<!-- Prefetch data for next page -->
<link rel="prefetch" href="/api/scores?slug=akatombo" />
```

---

## Monitoring & Measurement

### Development

```bash
# Performance trace
npm run dev
# Open Chrome DevTools → Lighthouse → Run analysis
```

### Production

1. **Real User Monitoring (RUM):**

```javascript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  console.log(metric);
  // Send to your analytics service
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

2. **Lighthouse CI:**

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

3. **Third-party monitoring:**
   - [Speedcurve](https://speedcurve.com/)
   - [Calibre](https://calibreapp.com/)
   - [PageSpeed Insights](https://pagespeed.web.dev/)

---

## Performance Checklist

### Before Deploying

- [ ] **Fonts:** Load only needed weights OR self-host OR use system fonts
- [ ] **Compression:** Verify gzip/brotli enabled in production
- [ ] **JavaScript:** Bundle size < 200 KB (gzipped)
- [ ] **Images:** All images optimized (WebP/AVIF)
- [ ] **Lazy loading:** Non-critical images/components lazy loaded
- [ ] **Caching:** Static assets have cache headers
- [ ] **API calls:** Parallel where possible
- [ ] **Lighthouse score:** > 90 for Performance

### Target Metrics (Production)

- **LCP:** < 1,000 ms ✅
- **FID:** < 100 ms ✅
- **CLS:** < 0.1 ✅ (Already perfect!)
- **TTFB:** < 600 ms (< 200ms ideal)
- **Total page size:** < 1 MB
- **JavaScript size:** < 200 KB (gzipped)

---

## Quick Wins (Implement Today)

### 1. Optimize Fonts (10 minutes)

```diff
- href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap"
+ href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap"
```

**Savings:** ~150 KB, ~200ms

### 2. Preload Critical Resources (5 minutes)

```html
<head>
  <!-- Preload critical font -->
  <link
    rel="preload"
    href="https://fonts.gstatic.com/s/notosansjp/v56/..."
    as="font"
    type="font/woff2"
    crossorigin
  />
</head>
```

**Savings:** ~100ms

### 3. Defer Non-Critical JavaScript (15 minutes)

```html
<!-- Move analytics, chat widgets, etc. to bottom of body -->
<script defer src="analytics.js"></script>
```

**Savings:** ~200ms LCP

---

## Long-term Optimizations

### 1. Migrate to Edge Functions

Deploy to edge locations (Cloudflare Workers, Vercel Edge, Netlify Edge):
- **TTFB:** < 100ms globally
- **Cold start:** < 50ms

### 2. Implement HTTP/3

Upgrade to HTTP/3 (QUIC):
- Faster connection establishment
- Better handling of packet loss
- Multiplexing without head-of-line blocking

### 3. Use CDN for Static Assets

Serve fonts, images, JS from CDN:
- Cloudflare
- Fastly
- CloudFront

---

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Astro Performance Guide](https://docs.astro.build/en/guides/performance/)
- [Font Loading Strategies](https://web.dev/font-best-practices/)

---

## Next Steps

1. ✅ Run through performance checklist
2. ✅ Implement quick wins (fonts optimization)
3. ✅ Test in production build (`npm run build && npm run preview`)
4. ✅ Measure with Lighthouse
5. ✅ Deploy and verify with real users
6. ✅ Set up monitoring
7. ✅ Iterate based on data
