<script lang="ts">
  import { onMount } from 'svelte';
  import { formatDate } from '$lib/utils';
  import type { PageData } from './$types';

  export let data: PageData;

  let { post } = data;

  // Register Web Components on mount
  onMount(async () => {
    await import('$components/web-components');
  });

  // Handle save event from music-editor
  function handleSave(event: CustomEvent) {
    console.log('Save requested:', event.detail);
    // In a real app, this would call an API endpoint
    alert(`Saving piece: ${event.detail.title}\nNotation: ${event.detail.value}`);
  }

  // Handle fork event from music-editor
  function handleFork(event: CustomEvent) {
    console.log('Fork requested:', event.detail);
    // In a real app, this would create a new piece
    alert(`Forking piece: ${event.detail.title}`);
  }

  // Handle note click
  function handleNoteClick(event: CustomEvent) {
    console.log('Note clicked:', event.detail);
  }
</script>

<svelte:head>
  <title>{post.title} - Shakuhachi.ro</title>
</svelte:head>

<div class="container">
  <nav class="breadcrumb">
    <a href="/">← Back to pieces</a>
  </nav>

  <article>
    <header>
      <h1>{post.title}</h1>
      <time class="date">{formatDate(post.date)}</time>
    </header>

    <!-- Interactive Music Editor (Web Component) -->
    <music-editor
      value={post.content}
      title={post.title}
      on:save={handleSave}
      on:fork={handleFork}
    ></music-editor>

    <!-- Display individual notes -->
    <section class="notes-display">
      <h2>Notes Breakdown</h2>
      <div class="notes-grid">
        {#each post.notes as note}
          <music-note
            note-string={note}
            display-mode="all"
            on:note-click={handleNoteClick}
          ></music-note>
        {/each}
      </div>
    </section>
  </article>
</div>

<style>
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .breadcrumb {
    margin-bottom: 2rem;
  }

  .breadcrumb a {
    color: #2563eb;
    text-decoration: none;
    font-size: 0.875rem;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }

  article header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  .date {
    color: #6b7280;
    font-size: 0.875rem;
  }

  music-editor {
    margin-bottom: 2rem;
  }

  .notes-display {
    margin-top: 3rem;
    padding: 2rem;
    background: #f9fafb;
    border-radius: 8px;
  }

  .notes-display h2 {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 1.5rem;
  }

  .notes-grid {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
</style>
