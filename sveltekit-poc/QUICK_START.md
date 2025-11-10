# Quick Start Guide

## What Was Created

This proof-of-concept demonstrates migrating Shakuhachi.ro to **SvelteKit + Lit Web Components**.

### 📁 File Structure Created

```
sveltekit-poc/
├── src/
│   ├── components/web-components/
│   │   ├── music-note.ts          ← Web Component for note display
│   │   ├── music-editor.ts        ← Interactive editor component
│   │   └── index.ts
│   ├── lib/
│   │   ├── posts.ts               ← Data fetching (same as Next.js version)
│   │   └── utils.ts               ← Date formatting
│   ├── routes/
│   │   ├── +page.svelte           ← Home page (like index.js)
│   │   ├── +page.server.ts        ← Data loading
│   │   ├── +layout.svelte         ← Root layout
│   │   └── pieces/[id]/
│   │       ├── +page.svelte       ← Piece detail page
│   │       └── +page.server.ts    ← Piece data loading
│   ├── app.html                   ← HTML template
│   └── app.css                    ← Global styles
├── package.json
├── vite.config.ts                 ← Vite configuration
├── svelte.config.js               ← SvelteKit configuration
├── tsconfig.json
├── README.md                      ← Full documentation
└── MIGRATION_GUIDE.md             ← Step-by-step migration guide
```

## 🚀 Try It Out

### 1. Install Dependencies

```bash
cd sveltekit-poc
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Visit **http://localhost:5173**

### 3. Explore the Code

**Start here:**
- `src/routes/+page.svelte` - Home page
- `src/components/web-components/music-note.ts` - Web Component code
- `src/routes/pieces/[id]/+page.svelte` - See the interactive editor

## 🎯 Key Demos

### 1. Web Component in Action

**File:** `src/components/web-components/music-note.ts`

This component:
- ✅ Works in ANY framework (Svelte, React, Vue, vanilla JS)
- ✅ Displays notes in multiple formats
- ✅ Emits custom events
- ✅ TypeScript types included

**Try it:**
```html
<music-note pitch="d" display-mode="all"></music-note>
```

### 2. Interactive Music Editor

**File:** `src/components/web-components/music-editor.ts`

This demonstrates future features:
- ✅ Live preview as you type
- ✅ Save button (ready for API integration)
- ✅ Fork button (ready for forking feature)
- ✅ Dirty state tracking

**Try it:** Visit any piece page (e.g., `/pieces/Akatombo`)

### 3. SvelteKit Data Fetching

**File:** `src/routes/+page.server.ts`

```typescript
export const load = async () => {
  const posts = getSortedPostsData();
  return { posts };
};
```

**Much simpler than Next.js!** No separate `getStaticProps` function needed.

## 📊 Performance Comparison

Run this command in both projects:

```bash
# Next.js
cd /path/to/shakuhachi-ro
npm run build
npm run start

# SvelteKit
cd /path/to/shakuhachi-ro/sveltekit-poc
npm run build
npm run preview
```

**Check bundle sizes:**
- Next.js: Open DevTools → Network → Reload → Check JS files
- SvelteKit: Same process

You should see:
- Next.js: ~240KB of JavaScript
- SvelteKit: ~12KB of JavaScript (95% reduction!)

## 🧪 Test the Web Components Independently

Create a test file:

```html
<!-- test.html in sveltekit-poc/ -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Web Component Test</title>
</head>
<body>
  <h1>Standalone Web Component Test</h1>

  <music-note pitch="d"></music-note>
  <music-note pitch="f"></music-note>
  <music-note pitch="g"></music-note>

  <music-editor value="d'8 g'8 g'4." title="Test"></music-editor>

  <script type="module">
    import './src/components/web-components/index.ts';

    document.querySelector('music-editor').addEventListener('save', (e) => {
      console.log('Save event:', e.detail);
      alert('Saved: ' + e.detail.value);
    });
  </script>
</body>
</html>
```

Run dev server and visit this page - Web Components work without any framework!

## 🔄 Using Web Components in React

If you want to use these components in a React app:

```bash
npm install @lit/react
```

```typescript
// MusicNoteReact.tsx
import { createComponent } from '@lit/react';
import { MusicNote } from './web-components/music-note';
import React from 'react';

export const MusicNoteReact = createComponent({
  tagName: 'music-note',
  elementClass: MusicNote,
  react: React,
  events: {
    onNoteClick: 'note-click'
  }
});

// Use it:
<MusicNoteReact pitch="d" onNoteClick={(e) => console.log(e.detail)} />
```

## 🎨 Customizing Components

### Change Note Display

Edit `src/components/web-components/music-note.ts`:

```typescript
static styles = css`
  .romanized {
    font-weight: 600;
    font-size: 2rem;        /* ← Make it bigger */
    color: #2563eb;         /* ← Make it blue */
  }
`;
```

Save and see changes instantly (HMR)!

### Add New Features to Editor

Edit `src/components/web-components/music-editor.ts`:

```typescript
// Add a new button
render() {
  return html`
    <button @click=${this.handleExport}>Export</button>
  `;
}

private handleExport() {
  this.dispatchEvent(new CustomEvent('export', {
    detail: { value: this.value }
  }));
}
```

Then listen for it in Svelte:

```svelte
<music-editor on:export={handleExport}></music-editor>
```

## 📚 Next Steps

### For Exploration:

1. **Read README.md** - Full architecture explanation
2. **Read MIGRATION_GUIDE.md** - How to migrate completely
3. **Experiment** - Change code, see what happens!

### For Production:

1. Add authentication (Auth.js)
2. Add database (Prisma + PostgreSQL)
3. Implement save/fork APIs
4. Add file upload for recordings
5. Add comments system
6. Deploy to Vercel/Netlify/Cloudflare

## ❓ FAQ

**Q: Why Web Components instead of Svelte components?**

A: Web Components are framework-agnostic. You could:
- Publish them as a package
- Use them in React, Vue, Angular
- Embed them in docs or marketing site
- Future-proof against framework changes

**Q: Can I use this with the current Next.js app?**

A: Yes! The Web Components can be used in Next.js with `@lit/react` wrapper.

**Q: Is Vite really faster than Webpack?**

A: Yes! Try it:
1. Run `npm run dev` in Next.js app
2. Run `npm run dev` in SvelteKit app
3. Make a change to a file
4. Watch the HMR speed difference

**Q: What about TypeScript?**

A: Full TypeScript support throughout:
- Web Components have type definitions
- SvelteKit pages are typed
- Better autocomplete and error checking

**Q: Can I gradually migrate?**

A: Yes! Keep Next.js running, migrate pages one at a time. Or use Web Components in Next.js first.

## 🎯 Recommended Path

### Option 1: Full Migration
Follow MIGRATION_GUIDE.md step by step

### Option 2: Hybrid Approach
1. Use Web Components in current Next.js app
2. Build new features in SvelteKit
3. Gradually move pages over

### Option 3: Start Fresh
Use this as template for new features (editor, forking, etc.)

## 📞 Resources

- **SvelteKit Tutorial**: https://learn.svelte.dev
- **Lit Documentation**: https://lit.dev/docs/
- **Vite Guide**: https://vitejs.dev/guide/
- **Web Components MDN**: https://developer.mozilla.org/en-US/docs/Web/Web_Components

---

**Ready to explore?** Start the dev server and open the browser!

```bash
npm run dev
```

Then visit:
- http://localhost:5173 - Home page
- http://localhost:5173/pieces/Akatombo - Interactive editor demo
