import { getScoreBySlug, getScore, forkScore } from '../api/scores';
import { authState } from '../api/authState';
import { ScoreRenderer } from '../renderer/ScoreRenderer';
import { MusicXMLParser } from '../parser/MusicXMLParser';
import { renderIcon, initIcons } from '../utils/icons';
import type { Score } from '../api/scores';

export class ScoreDetail {
  private container: HTMLElement;
  private slug: string;
  private score: Score | null = null;
  private parentScore: Score | null = null;
  private renderer: ScoreRenderer | null = null;
  private isLoading: boolean = true;
  private error: Error | null = null;

  constructor(containerId: string, slug: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    this.slug = slug;

    // Listen for theme changes and re-render score
    this.setupThemeListener();

    this.loadScore();
  }

  private setupThemeListener(): void {
    // Use MutationObserver to watch for theme class changes on <html>
    const observer = new MutationObserver(() => {
      // Re-render score when theme changes
      if (this.score) {
        this.renderScore();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  private async loadScore(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.render();

    const result = await getScoreBySlug(this.slug);

    this.isLoading = false;

    if (result.error || !result.score) {
      this.error = result.error || new Error('Score not found');
      this.render();
      return;
    }

    this.score = result.score;

    // Load parent score if this is a fork
    if (this.score.forked_from) {
      const parentResult = await getScore(this.score.forked_from);
      if (!parentResult.error && parentResult.score) {
        this.parentScore = parentResult.score;
      }
    }

    this.render();
    this.renderScore();
  }

  private async renderScore(): Promise<void> {
    if (!this.score) return;

    const scoreContainer = this.container.querySelector('#score-renderer');
    if (!scoreContainer) return;

    try {
      // Read theme-aware colors from CSS variables
      const noteColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-neutral-700')
        .trim();
      const debugLabelColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-neutral-500')
        .trim();

      this.renderer = new ScoreRenderer(scoreContainer as HTMLElement, {
        showDebugLabels: false,
        noteColor: noteColor || '#000', // Fallback to black
        debugLabelColor: debugLabelColor || '#999', // Fallback to gray
      });

      if (this.score.data_format === 'json') {
        await this.renderer.renderFromScoreData(this.score.data);
      } else if (this.score.data_format === 'musicxml') {
        // Parse MusicXML string to ScoreData
        const scoreData = MusicXMLParser.parse(this.score.data);
        await this.renderer.renderFromScoreData(scoreData);
      } else {
        scoreContainer.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <p>Unsupported format: ${this.score.data_format}</p>
          </div>
        `;
      }
    } catch (error) {
      scoreContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--color-danger-600);">
          <p>Error rendering score: ${
            error instanceof Error ? error.message : 'Unknown error'
          }</p>
        </div>
      `;
    }
  }

  private render(): void {
    if (this.isLoading) {
      this.container.innerHTML = `
        <div class="score-detail-loading">
          <div class="spinner"></div>
          <p>Loading score...</p>
        </div>
      `;
      this.addStyles();
      return;
    }

    if (this.error || !this.score) {
      this.container.innerHTML = `
        <div class="score-detail-error">
          <h2>Score Not Found</h2>
          <p>${
            this.error?.message ||
            'The score you are looking for does not exist.'
          }</p>
          <a href="/" class="btn btn-primary">Browse All Scores</a>
        </div>
      `;
      this.addStyles();
      return;
    }

    const currentUser = authState.getUser();
    const isOwner = currentUser && currentUser.id === this.score.user_id;

    this.container.innerHTML = `
      <div class="score-detail-header">
        <div class="score-detail-metadata">
          <h1>${this.escapeHtml(this.score.title)}</h1>
          ${
            this.score.composer
              ? `
            <p class="score-composer">By ${this.escapeHtml(
              this.score.composer,
            )}</p>
          `
              : ''
          }

          ${
            this.parentScore
              ? `
            <div class="fork-attribution">
              ${renderIcon('git-fork')} Forked from <a href="/score.html?slug=${
                this.parentScore.slug
              }">${this.escapeHtml(this.parentScore.title)}</a>
            </div>
          `
              : ''
          }

          ${
            this.score.description
              ? `
            <p class="score-description">${this.escapeHtml(
              this.score.description,
            )}</p>
          `
              : ''
          }

          <div class="score-stats">
            <span class="score-stat">${renderIcon('git-fork')} ${
              this.score.fork_count
            } forks</span>
            <span class="score-stat">${renderIcon(
              'calendar',
            )} ${this.formatDate(this.score.created_at)}</span>
          </div>
        </div>

        <div class="score-detail-actions">
          ${
            isOwner
              ? `
            <a href="/editor.html?id=${this.score.id}" class="btn btn-primary">Edit Score</a>
          `
              : ''
          }
          <button id="fork-btn" class="btn ${
            isOwner ? 'btn-secondary' : 'btn-primary'
          }">Fork Score</button>
          <a href="/" class="btn btn-secondary">Back to Library</a>
        </div>
      </div>

      <div class="score-renderer-container">
        <div id="score-renderer"></div>
      </div>
    `;

    this.addStyles();
    this.attachEventListeners();
    initIcons();
  }

  private attachEventListeners(): void {
    const forkBtn = this.container.querySelector('#fork-btn');
    forkBtn?.addEventListener('click', () => this.handleFork());
  }

  private async handleFork(): Promise<void> {
    if (!this.score) return;

    // Disable the fork button to prevent double-clicks
    const forkBtn = this.container.querySelector(
      '#fork-btn',
    ) as HTMLButtonElement;
    if (forkBtn) {
      forkBtn.disabled = true;
      forkBtn.textContent = 'Forking...';
    }

    const result = await forkScore(this.score.id);

    if (result.error) {
      alert(`Error forking score: ${result.error.message}`);
      if (forkBtn) {
        forkBtn.disabled = false;
        forkBtn.textContent = 'Fork Score';
      }
      return;
    }

    // Redirect to editor with the forked score
    window.location.href = `/editor.html?id=${result.score!.id}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  private addStyles(): void {
    if (document.getElementById('score-detail-styles')) return;

    const style = document.createElement('style');
    style.id = 'score-detail-styles';
    style.textContent = `
      .score-detail-header {
        background: var(--panel-background-color);
        padding: var(--spacing-x-large);
        border-radius: var(--border-radius-large);
        margin-bottom: var(--spacing-x-large);
        box-shadow: var(--shadow-small);
      }

      .score-detail-metadata h1 {
        font-size: var(--font-size-3x-large);
        font-weight: var(--font-weight-light);
        margin-bottom: var(--spacing-small);
        color: var(--color-neutral-700);
      }

      .score-composer {
        font-size: var(--font-size-large);
        color: var(--color-neutral-600);
        font-style: italic;
        margin-bottom: var(--spacing-large);
      }

      .fork-attribution {
        display: flex;
        align-items: center;
        gap: var(--spacing-2x-small);
        padding: var(--spacing-small) var(--spacing-medium);
        background: var(--color-neutral-100);
        border-left: 3px solid var(--color-primary-600);
        border-radius: var(--border-radius-medium);
        margin-bottom: var(--spacing-medium);
        font-size: var(--font-size-small);
        color: var(--color-neutral-600);
      }

      .fork-attribution svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .fork-attribution a {
        color: var(--color-primary-600);
        text-decoration: none;
        font-weight: var(--font-weight-semibold);
      }

      .fork-attribution a:hover {
        text-decoration: underline;
      }

      .score-description {
        font-size: var(--font-size-medium);
        line-height: var(--line-height-normal);
        color: var(--color-neutral-700);
        margin-bottom: var(--spacing-large);
      }

      .score-stats {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-large);
        padding-top: var(--spacing-large);
        border-top: var(--panel-border-width) solid var(--color-neutral-300);
      }

      .score-stat {
        display: flex;
        align-items: center;
        gap: var(--spacing-2x-small);
        color: var(--color-neutral-600);
        font-size: var(--font-size-small);
      }

      .score-stat svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .score-detail-actions {
        display: flex;
        gap: var(--spacing-small);
        margin-top: var(--spacing-large);
      }

      .btn {
        padding: var(--spacing-x-small) var(--spacing-small);
        border-radius: var(--border-radius-medium);
        cursor: pointer;
        font-size: var(--font-size-small);
        text-decoration: none;
        display: inline-block;
        transition: background var(--transition-fast);
      }

      .btn-primary {
        background: var(--color-primary-600);
        color: var(--color-neutral-0);
        border: none;
      }

      .btn-primary:hover {
        background: var(--color-primary-700);
      }

      .btn-secondary {
        background: var(--color-neutral-200);
        color: var(--color-neutral-700);
        border: var(--input-border-width) solid var(--color-neutral-300);
      }

      .btn-secondary:hover {
        background: var(--color-neutral-300);
      }

      .score-renderer-container {
        flex: 1;
        min-height: 0;
      }

      #score-renderer {
        height: 100%;
      }

      .score-detail-loading {
        text-align: center;
        padding: var(--spacing-3x-large) var(--spacing-large);
      }

      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid var(--color-neutral-200);
        border-top: 4px solid var(--color-primary-600);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto var(--spacing-large);
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .score-detail-error {
        text-align: center;
        padding: var(--spacing-3x-large) var(--spacing-large);
      }

      .score-detail-error h2 {
        margin-bottom: var(--spacing-small);
        color: var(--color-danger-600);
      }

      .score-detail-error p {
        margin-bottom: var(--spacing-large);
        color: var(--color-neutral-600);
      }

      @media (max-width: 768px) {
        .score-detail-metadata h1 {
          font-size: var(--font-size-2x-large);
        }

        .score-detail-actions {
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
