<script lang="ts">
  import { onMount } from 'svelte';
  import { formatDate } from '$lib/utils';
  import type { PageData } from './$types';

  export let data: PageData;

  // Register Web Components on mount
  onMount(async () => {
    await import('$components/web-components');
  });
</script>

<svelte:head>
  <title>Shakuhachi.ro - Japanese Bamboo Flute Notation</title>
  <meta name="description" content="Learn and convert shakuhachi musical notation" />
</svelte:head>

<div class="container">
  <header>
    <h1>Welcome to Shakuhachi.ro</h1>
    <p class="subtitle">Japanese Bamboo Flute Notation Converter</p>
  </header>

  <section class="notation-reference">
    <h2>What are the correct characters for the notes?</h2>

    <div class="note-grid">
      <!-- Using Web Components -->
      <music-note pitch="d" display-mode="all"></music-note>
      <music-note pitch="f" display-mode="all"></music-note>
      <music-note pitch="g" display-mode="all"></music-note>
      <music-note pitch="a" display-mode="all"></music-note>
      <music-note pitch="c" display-mode="all"></music-note>
    </div>
  </section>

  <section class="pieces">
    <h2>Pieces</h2>
    <ul class="piece-list">
      {#each data.posts as post}
        <li>
          <a href="/pieces/{post.id}">
            {post.title}
          </a>
          <small class="date">{formatDate(post.date)}</small>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
  }

  h1 {
    font-size: 2.5rem;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 1.125rem;
    color: #666;
  }

  section {
    margin-bottom: 3rem;
  }

  h2 {
    font-size: 1.875rem;
    color: #333;
    margin-bottom: 1.5rem;
  }

  .note-grid {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    padding: 2rem;
    background: #f9fafb;
    border-radius: 8px;
  }

  .piece-list {
    list-style: none;
    padding: 0;
  }

  .piece-list li {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .piece-list li:last-child {
    border-bottom: none;
  }

  .piece-list a {
    font-size: 1.125rem;
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }

  .piece-list a:hover {
    text-decoration: underline;
  }

  .date {
    display: block;
    margin-top: 0.25rem;
    color: #6b7280;
    font-size: 0.875rem;
  }
</style>
