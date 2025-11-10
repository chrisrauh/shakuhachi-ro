# Migration Guide: Next.js → SvelteKit + Lit

Step-by-step guide to migrate the full Shakuhachi.ro application.

## Phase 1: Setup (1-2 hours)

### 1.1 Install SvelteKit

```bash
# In the project root, alongside existing Next.js app
npm create svelte@latest sveltekit-app
cd sveltekit-app
```

Choose:
- ✅ SvelteKit demo app → No (start fresh)
- ✅ Type checking → Yes, using TypeScript
- ✅ ESLint → Yes
- ✅ Prettier → Yes

### 1.2 Install Dependencies

```bash
npm install lit date-fns gray-matter
npm install -D @types/node
```

### 1.3 Copy Configuration Files

From this POC:
- `vite.config.ts`
- `svelte.config.js`
- `tsconfig.json`

## Phase 2: Create Web Components (2-4 hours)

### 2.1 Copy Web Component Files

Copy from POC:
- `src/components/web-components/music-note.ts`
- `src/components/web-components/music-editor.ts`
- `src/components/web-components/index.ts`

### 2.2 Test Web Components Independently

Create `test.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Web Component Test</title>
  <script type="module" src="/src/components/web-components/index.ts"></script>
</head>
<body>
  <h1>Testing Music Components</h1>

  <h2>Individual Notes</h2>
  <music-note pitch="d"></music-note>
  <music-note pitch="f"></music-note>
  <music-note pitch="g"></music-note>

  <h2>Music Editor</h2>
  <music-editor value="d'8 g'8 g'4." title="Test Piece"></music-editor>

  <script>
    document.querySelector('music-editor').addEventListener('save', (e) => {
      console.log('Saved:', e.detail);
      alert('Save works!');
    });
  </script>
</body>
</html>
```

Run: `npm run dev` and visit the test page.

### 2.3 Update SVG Paths

The Web Components reference SVG files. Ensure they're accessible:

```typescript
// Option 1: Copy SVGs to static folder
// Copy ../svgs/* to static/svgs/

// Option 2: Import SVGs in Vite
// Update music-note.ts to import SVGs directly
```

## Phase 3: Migrate Data Layer (1-2 hours)

### 3.1 Copy and Update `lib/posts.ts`

Copy from POC, adjust path to posts directory:

```typescript
// OLD (Next.js)
const postsDirectory = path.join(process.cwd(), 'posts');

// NEW (SvelteKit) - if keeping posts in parent directory
const postsDirectory = path.join(process.cwd(), '..', 'posts');

// BETTER - move posts into SvelteKit project
const postsDirectory = path.join(process.cwd(), 'content', 'posts');
```

### 3.2 Optional: Use Content Collections

For better type safety:

```bash
npm install mdsvex
```

```typescript
// svelte.config.js
import { mdsvex } from 'mdsvex';

const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [vitePreprocess(), mdsvex()],
  // ...
};
```

Then use `.md` files directly as routes!

## Phase 4: Migrate Pages (3-5 hours)

### 4.1 Home Page

**From:** `pages/index.js`
**To:** `src/routes/+page.svelte` + `src/routes/+page.server.ts`

1. Copy server-side logic:
```typescript
// +page.server.ts
export const load = async () => {
  const posts = getSortedPostsData();
  return { posts };
};
```

2. Convert JSX to Svelte:
```svelte
<!-- +page.svelte -->
<script lang="ts">
  export let data;
  // Register Web Components
  onMount(() => import('$components/web-components'));
</script>

{#each data.posts as post}
  <a href="/pieces/{post.id}">{post.title}</a>
{/each}
```

### 4.2 Piece Detail Page

**From:** `pages/posts/[id].js`
**To:** `src/routes/pieces/[id]/+page.svelte` + `+page.server.ts`

1. Data fetching:
```typescript
// +page.server.ts
export const load = async ({ params }) => {
  const post = getPostData(params.id);
  return { post };
};
```

2. Component:
```svelte
<!-- +page.svelte -->
<script lang="ts">
  export let data;

  function handleSave(e: CustomEvent) {
    // TODO: Implement save API
  }
</script>

<music-editor
  value={data.post.content}
  on:save={handleSave}
></music-editor>
```

### 4.3 Layout

**From:** `components/layout.js`
**To:** `src/routes/+layout.svelte`

Convert the RadioGroup - options:

**Option A: Keep interactivity in Svelte**
```svelte
<script>
  let noteDisplay = 'all';

  const options = [
    { value: 'name', label: 'Name' },
    { value: 'katakana', label: 'Font' },
    { value: 'all', label: 'All' }
  ];
</script>

<nav>
  {#each options as option}
    <label>
      <input
        type="radio"
        bind:group={noteDisplay}
        value={option.value}
      />
      {option.label}
    </label>
  {/each}
</nav>
```

**Option B: Create Web Component**
Create `<note-display-toggle>` Web Component.

## Phase 5: Add New Features (Future)

### 5.1 Database Setup

```bash
npm install prisma @prisma/client
npx prisma init
```

```prisma
// prisma/schema.prisma
model Piece {
  id        String   @id @default(cuid())
  title     String
  content   String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  comments  Comment[]
  forks     Piece[]   @relation("PieceForks")
  parentId  String?
  parent    Piece?    @relation("PieceForks", fields: [parentId], references: [id])
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  pieces    Piece[]
  comments  Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  pieceId   String
  piece     Piece    @relation(fields: [pieceId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

Run:
```bash
npx prisma migrate dev
```

### 5.2 Authentication

```bash
npm install @auth/core @auth/sveltekit
```

```typescript
// src/hooks.server.ts
import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/core/providers/github';

export const handle = SvelteKitAuth({
  providers: [GitHub({ clientId: '...', clientSecret: '...' })]
});
```

### 5.3 API Endpoints for CRUD

```typescript
// src/routes/api/pieces/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/db';

export const PUT = async ({ params, request, locals }) => {
  const session = await locals.getSession();
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();

  const piece = await db.piece.update({
    where: { id: params.id },
    data: { content: data.content }
  });

  return json(piece);
};

export const DELETE = async ({ params, locals }) => {
  const session = await locals.getSession();
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.piece.delete({
    where: { id: params.id }
  });

  return json({ success: true });
};
```

### 5.4 Forking

```typescript
// src/routes/api/pieces/[id]/fork/+server.ts
export const POST = async ({ params, locals }) => {
  const session = await locals.getSession();
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const original = await db.piece.findUnique({
    where: { id: params.id }
  });

  const fork = await db.piece.create({
    data: {
      title: `${original.title} (fork)`,
      content: original.content,
      userId: session.user.id,
      parentId: original.id
    }
  });

  return json(fork);
};
```

Update `<music-editor>` to call this:

```svelte
<script>
  async function handleFork(e: CustomEvent) {
    const res = await fetch(`/api/pieces/${data.post.id}/fork`, {
      method: 'POST'
    });
    const fork = await res.json();
    goto(`/pieces/${fork.id}/edit`);
  }
</script>

<music-editor on:fork={handleFork} />
```

### 5.5 File Uploads (Recordings)

```typescript
// src/routes/api/recordings/upload/+server.ts
import { writeFile } from 'fs/promises';
import path from 'path';

export const POST = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('recording') as File;

  if (!file) {
    return json({ error: 'No file' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join('static', 'uploads', filename);

  await writeFile(filepath, buffer);

  return json({
    url: `/uploads/${filename}`,
    filename
  });
};
```

Create upload component:

```svelte
<!-- RecordingUpload.svelte -->
<script lang="ts">
  let uploading = false;
  let fileInput: HTMLInputElement;

  async function handleUpload() {
    const file = fileInput.files?.[0];
    if (!file) return;

    uploading = true;
    const formData = new FormData();
    formData.append('recording', file);

    const res = await fetch('/api/recordings/upload', {
      method: 'POST',
      body: formData
    });

    const { url } = await res.json();
    uploading = false;

    // Attach to piece
    await fetch(`/api/pieces/${pieceId}/recordings`, {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  }
</script>

<input type="file" accept="audio/*" bind:this={fileInput} />
<button on:click={handleUpload} disabled={uploading}>
  {uploading ? 'Uploading...' : 'Upload Recording'}
</button>
```

### 5.6 Comments

```typescript
// src/routes/api/pieces/[id]/comments/+server.ts
export const GET = async ({ params }) => {
  const comments = await db.comment.findMany({
    where: { pieceId: params.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  return json(comments);
};

export const POST = async ({ params, request, locals }) => {
  const session = await locals.getSession();
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content } = await request.json();

  const comment = await db.comment.create({
    data: {
      content,
      pieceId: params.id,
      userId: session.user.id
    },
    include: { user: true }
  });

  return json(comment);
};
```

Comments component:

```svelte
<!-- Comments.svelte -->
<script lang="ts">
  export let pieceId: string;

  let comments = [];
  let newComment = '';

  onMount(async () => {
    const res = await fetch(`/api/pieces/${pieceId}/comments`);
    comments = await res.json();
  });

  async function postComment() {
    const res = await fetch(`/api/pieces/${pieceId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment })
    });

    const comment = await res.json();
    comments = [comment, ...comments];
    newComment = '';
  }
</script>

<div class="comments">
  <h3>Comments</h3>

  <form on:submit|preventDefault={postComment}>
    <textarea bind:value={newComment} required></textarea>
    <button type="submit">Post Comment</button>
  </form>

  {#each comments as comment}
    <div class="comment">
      <strong>{comment.user.name}</strong>
      <p>{comment.content}</p>
      <time>{new Date(comment.createdAt).toLocaleString()}</time>
    </div>
  {/each}
</div>
```

## Phase 6: Deployment

### Option 1: Vercel

```bash
npm install -D @sveltejs/adapter-vercel
```

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';
```

```bash
vercel
```

### Option 2: Netlify

```bash
npm install -D @sveltejs/adapter-netlify
```

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-netlify';
```

### Option 3: Cloudflare Pages

```bash
npm install -D @sveltejs/adapter-cloudflare
```

## Testing Checklist

- [ ] All pages load correctly
- [ ] Web Components display notes properly
- [ ] Music editor saves and forks
- [ ] File uploads work
- [ ] Comments post and display
- [ ] Authentication works
- [ ] Database operations succeed
- [ ] Build completes without errors
- [ ] Production bundle is small (<50KB total JS)

## Rollback Plan

Keep the Next.js version running until:
1. All features are implemented
2. All tests pass
3. Performance is validated
4. Users have tested in staging

Use feature flags to gradually roll out new version.

## Timeline Estimate

| Phase | Hours | Cumulative |
|-------|-------|------------|
| Setup | 1-2 | 2h |
| Web Components | 2-4 | 6h |
| Data Layer | 1-2 | 8h |
| Pages | 3-5 | 13h |
| New Features | 10-20 | 33h |
| Testing | 4-8 | 41h |
| **Total** | **21-41h** | **~1-2 weeks** |

## Questions During Migration

**Q: Can I migrate incrementally?**
A: Yes! Run both Next.js and SvelteKit in parallel, migrate pages one by one.

**Q: What about SEO?**
A: SvelteKit has excellent SSR/SSG support. Set up `+page.server.ts` for each route.

**Q: Do Web Components work in all browsers?**
A: Yes! All modern browsers support Web Components natively. Lit includes minimal polyfills for older browsers.

**Q: Can I still use React libraries?**
A: Some React libraries can be wrapped, but it's better to find Web Component or Svelte alternatives.

**Q: How do I handle forms?**
A: SvelteKit has amazing form handling with progressive enhancement. Use `<form method="POST">` + form actions.
