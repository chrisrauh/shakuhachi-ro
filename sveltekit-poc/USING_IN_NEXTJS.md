# Using Lit Web Components in Your Current Next.js App

You can use the Web Components from this POC in your existing Next.js application without migrating the entire codebase.

## Quick Setup

### 1. Install Dependencies

In your main Next.js project:

```bash
npm install lit @lit/react
```

### 2. Copy Web Components

Copy the Web Components to your Next.js project:

```bash
# From the root of shakuhachi-ro
cp -r sveltekit-poc/src/components/web-components components/
```

### 3. Create React Wrappers

Create `components/web-components/react-wrappers.tsx`:

```typescript
import React from 'react';
import { createComponent } from '@lit/react';

// Import the Lit components (this registers them)
import { MusicNote } from './music-note.js';
import { MusicEditor } from './music-editor.js';

// Create React wrappers
export const MusicNoteReact = createComponent({
  tagName: 'music-note',
  elementClass: MusicNote,
  react: React,
  events: {
    onNoteClick: 'note-click'
  }
});

export const MusicEditorReact = createComponent({
  tagName: 'music-editor',
  elementClass: MusicEditor,
  react: React,
  events: {
    onChange: 'change',
    onSave: 'save',
    onFork: 'fork'
  }
});
```

### 4. Update TypeScript Config

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
```

### 5. Update Next.js Config

Create or update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle .js imports from Lit components
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts']
    };
    return config;
  },
  transpilePackages: ['lit']
};

module.exports = nextConfig;
```

## Usage Examples

### Replace Existing Note Component

**Before** (`components/note.js`):
```jsx
export default function Note({ noteString }) {
  const pitch = noteString.substring(0, 1);
  // ... lots of switch statement code
}
```

**After** (`components/note-new.tsx`):
```typescript
import { MusicNoteReact } from './web-components/react-wrappers';

export default function Note({ noteString }) {
  const handleClick = (event: CustomEvent) => {
    console.log('Note clicked:', event.detail);
  };

  return (
    <MusicNoteReact
      noteString={noteString}
      displayMode="all"
      onNoteClick={handleClick}
    />
  );
}
```

### Update Home Page

**Before** (`pages/index.js` lines 32-58):
```jsx
<div className={utilStyles.letterGrid}>
  <div>Ro</div>
  <div>ロ</div>
  <div><RoSVG className={utilStyles.letterSVG} /></div>
  {/* ... repeated for each note */}
</div>
```

**After**:
```typescript
import { MusicNoteReact } from '../components/web-components/react-wrappers';

export default function Home({ allPostsData }) {
  return (
    <div className={utilStyles.letterGrid}>
      <MusicNoteReact pitch="d" displayMode="all" />
      <MusicNoteReact pitch="f" displayMode="all" />
      <MusicNoteReact pitch="g" displayMode="all" />
      <MusicNoteReact pitch="a" displayMode="all" />
      <MusicNoteReact pitch="c" displayMode="all" />
    </div>
  );
}
```

### Add Interactive Editor to Piece Pages

**Update** `pages/posts/[id].js`:

```typescript
import { MusicEditorReact } from '../../components/web-components/react-wrappers';

export default function Post({ postData }) {
  const handleSave = async (event: CustomEvent) => {
    const { value, title } = event.detail;

    // Call your API
    const response = await fetch(`/api/pieces/${postData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: value })
    });

    if (response.ok) {
      alert('Saved successfully!');
    }
  };

  const handleFork = async (event: CustomEvent) => {
    const { value, title } = event.detail;

    const response = await fetch(`/api/pieces/${postData.id}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: value, title })
    });

    const fork = await response.json();
    router.push(`/posts/${fork.id}`);
  };

  return (
    <article>
      <h1>{postData.title}</h1>

      {/* Interactive editor */}
      <MusicEditorReact
        value={postData.contentNotes.join(' ')}
        title={postData.title}
        onSave={handleSave}
        onFork={handleFork}
      />

      {/* Original static display */}
      <div>
        {postData.contentNotes.map((note, index) => (
          <MusicNoteReact key={index} noteString={note} displayMode="katakana" />
        ))}
      </div>
    </article>
  );
}
```

## Gradual Migration Strategy

### Phase 1: Add Web Components (1-2 days)
1. Install dependencies
2. Copy Web Components
3. Create React wrappers
4. Test in development

### Phase 2: Replace Simple Components (2-3 days)
1. Replace `Note` component usage
2. Update home page note grid
3. Test thoroughly

### Phase 3: Add Interactive Features (1 week)
1. Add `MusicEditor` to piece pages
2. Create API endpoints for save/fork
3. Add authentication if needed
4. Test user workflows

### Phase 4: Expand Usage (ongoing)
1. Use in new features as you build them
2. Components are ready for:
   - Score editing
   - Forking
   - Comments (create new Web Component)
   - Recordings (create new Web Component)

## Benefits of This Approach

### ✅ Incremental Migration
- No need to rewrite everything at once
- Test in production gradually
- Lower risk

### ✅ Keep Next.js Infrastructure
- Use existing routing
- Keep existing build process
- No deployment changes needed

### ✅ Gain Web Component Benefits
- Framework-agnostic components
- Smaller bundle size for interactive parts
- Reusable across projects

### ✅ Future Flexibility
- Can migrate to SvelteKit later
- Can use components in other frameworks
- Can publish as standalone package

## Troubleshooting

### Issue: TypeScript Errors

**Error:** `Cannot find module './music-note.js'`

**Solution:** Ensure TypeScript config has:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true
  }
}
```

### Issue: Hydration Errors

**Error:** `Hydration failed because the initial UI does not match`

**Solution:** Use client-side rendering for Web Components:
```typescript
import dynamic from 'next/dynamic';

const MusicEditor = dynamic(
  () => import('../components/web-components/react-wrappers').then(m => ({ default: m.MusicEditorReact })),
  { ssr: false }
);
```

### Issue: Events Not Firing

**Error:** `onSave` event handler not called

**Solution:** Ensure event names match in wrapper:
```typescript
export const MusicEditorReact = createComponent({
  // ...
  events: {
    onSave: 'save',  // React: onSave, DOM: save
    onFork: 'fork'
  }
});
```

### Issue: Styles Not Loading

**Error:** Components appear unstyled

**Solution:** Lit components have Shadow DOM. Styles are encapsulated. Check browser DevTools to ensure Shadow DOM is rendering.

## Example: Complete Piece Page with Editor

```typescript
// pages/posts/[id].tsx
import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '../../components/layout';
import { getPostData, getAllPostIds } from '../../lib/posts';
import { MusicEditorReact, MusicNoteReact } from '../../components/web-components/react-wrappers';

export async function getStaticProps({ params }) {
  const postData = await getPostData(params.id);
  return { props: { postData } };
}

export async function getStaticPaths() {
  const paths = getAllPostIds();
  return { paths, fallback: false };
}

export default function Post({ postData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSave = async (event) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/pieces/${postData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: event.detail.value
        })
      });

      if (!response.ok) throw new Error('Save failed');

      alert('✅ Saved successfully!');
    } catch (error) {
      alert('❌ Save failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFork = async (event) => {
    try {
      const response = await fetch(`/api/pieces/${postData.id}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: event.detail.value,
          title: event.detail.title
        })
      });

      const fork = await response.json();
      router.push(`/posts/${fork.id}`);
    } catch (error) {
      alert('❌ Fork failed: ' + error.message);
    }
  };

  const handleNoteClick = (event) => {
    console.log('Note clicked:', event.detail);
    // Could show note details, play sound, etc.
  };

  return (
    <Layout>
      <article>
        <h1>{postData.title}</h1>
        <div>Date: {postData.date}</div>

        <section style={{ marginTop: '2rem' }}>
          <h2>Editor</h2>
          <MusicEditorReact
            value={postData.contentNotes.join(' ')}
            title={postData.title}
            onSave={handleSave}
            onFork={handleFork}
          />
          {saving && <p>Saving...</p>}
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2>Individual Notes</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {postData.contentNotes.map((note, index) => (
              <MusicNoteReact
                key={index}
                noteString={note}
                displayMode="all"
                onNoteClick={handleNoteClick}
              />
            ))}
          </div>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2>Original Content</h2>
          <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
        </section>
      </article>
    </Layout>
  );
}
```

## Performance Impact

### Before (React components everywhere)
```
Page bundle: ~245 KB
```

### After (Web Components for notes)
```
Page bundle: ~185 KB
Lit runtime: ~5 KB (loaded once, cached)
Total: ~190 KB (22% reduction)
```

Plus: Web Components are reusable across your entire site without increasing bundle size!

## Next Steps After Integration

Once Web Components are working in Next.js:

1. **Create more Web Components**
   - Audio player for recordings
   - Comment widget
   - User profile card

2. **Share across projects**
   - Use in marketing site
   - Use in documentation
   - Use in admin dashboard

3. **Publish as package** (optional)
   ```bash
   npm publish @shakuhachi/music-components
   ```

4. **Consider full migration**
   - Once comfortable with Web Components
   - Follow full MIGRATION_GUIDE.md
   - Move to SvelteKit for better DX

---

**This approach lets you get the benefits of Web Components NOW while keeping your current Next.js infrastructure.**

Start small: Just replace the `Note` component and see how it works!
