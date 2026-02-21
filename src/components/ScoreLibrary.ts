import { getAllScores } from '../api/scores';
import type { Score } from '../api/scores';
import { renderIcon, initIcons } from '../utils/icons';
import '@github/relative-time-element';

export class ScoreLibrary {
  private container: HTMLElement;
  private scores: Score[] = [];
  private filteredScores: Score[] = [];
  private searchQuery: string = '';
  private isLoading: boolean = false;
  private error: Error | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    this.render();
    this.loadScores();
  }

  private async loadScores(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.render();

    const result = await getAllScores();

    this.isLoading = false;

    if (result.error) {
      this.error = result.error;
    } else {
      this.scores = result.scores;
      this.filteredScores = result.scores;
    }

    this.render();
  }

  private applyFilters(): void {
    let filtered = [...this.scores];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (score) =>
          score.title.toLowerCase().includes(query) ||
          (score.composer && score.composer.toLowerCase().includes(query)),
      );
    }

    this.filteredScores = filtered;
    this.renderGrid();
  }

  private handleSearch(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  private handleScoreClick(scoreSlug: string): void {
    // Navigate to score detail page
    window.location.href = `/score/${scoreSlug}`;
  }

  private render(): void {
    if (this.isLoading) {
      this.container.innerHTML = `
        <div class="score-library-loading">
          <div class="spinner"></div>
          <p>Loading scores...</p>
        </div>
      `;
      this.addStyles();
      return;
    }

    if (this.error) {
      this.container.innerHTML = `
        <div class="score-library-error">
          <h2>Error Loading Scores</h2>
          <p>${this.error.message}</p>
          <button id="retry-btn">Retry</button>
        </div>
      `;
      this.addStyles();

      const retryBtn = this.container.querySelector('#retry-btn');
      retryBtn?.addEventListener('click', () => this.loadScores());
      return;
    }

    this.container.innerHTML = `
      <div class="score-library">
        <div class="score-library-filters">
          <div class="search-bar">
            <input
              type="text"
              id="search-input"
              placeholder="Search by title or composer..."
              value="${this.searchQuery}"
            />
          </div>
          <p class="score-count" id="score-count">${
            this.filteredScores.length
          } ${this.filteredScores.length === 1 ? 'score' : 'scores'}</p>
        </div>

        <div class="score-library-grid" id="score-grid">
          ${
            this.filteredScores.length === 0
              ? `
            <div class="no-scores">
              <p>No scores found</p>
              ${
                this.searchQuery
                  ? `
                <button id="clear-filters-btn">Clear Filters</button>
              `
                  : ''
              }
            </div>
          `
              : this.filteredScores
                  .map((score) => this.renderScoreCard(score))
                  .join('')
          }
        </div>
      </div>
    `;

    this.addStyles();
    this.attachEventListeners();
    initIcons();
  }

  private renderGrid(): void {
    const gridElement = this.container.querySelector('#score-grid');
    const countElement = this.container.querySelector('#score-count');

    if (!gridElement || !countElement) {
      // Fallback to full render if grid not found
      this.render();
      return;
    }

    // Update count
    countElement.textContent = `${this.filteredScores.length} ${
      this.filteredScores.length === 1 ? 'score' : 'scores'
    }`;

    // Update grid
    gridElement.innerHTML =
      this.filteredScores.length === 0
        ? `
      <div class="no-scores">
        <p>No scores found</p>
        ${
          this.searchQuery
            ? `
          <button id="clear-filters-btn">Clear Filters</button>
        `
            : ''
        }
      </div>
    `
        : this.filteredScores
            .map((score) => this.renderScoreCard(score))
            .join('');

    // Initialize icons
    initIcons();

    // Reattach score card listeners
    const scoreCards = gridElement.querySelectorAll('.score-card');
    scoreCards.forEach((card) => {
      card.addEventListener('click', () => {
        const scoreSlug = card.getAttribute('data-score-slug');
        if (scoreSlug) {
          this.handleScoreClick(scoreSlug);
        }
      });
    });

    // Reattach clear filters button if present
    const clearFiltersBtn = gridElement.querySelector('#clear-filters-btn');
    clearFiltersBtn?.addEventListener('click', () => {
      this.searchQuery = '';
      this.applyFilters();

      // Update UI controls
      const searchInput = this.container.querySelector(
        '#search-input',
      ) as HTMLInputElement;
      if (searchInput) searchInput.value = '';
    });
  }

  private renderScoreCard(score: Score): string {
    return `
      <div class="score-card" data-score-slug="${score.slug}">
        <div class="score-card-header">
          <h3 class="score-title">
            ${this.escapeHtml(score.title)}
            ${
              score.forked_from
                ? `<span class="forked-indicator" title="This is a forked score">${renderIcon(
                    'git-fork',
                  )}</span>`
                : ''
            }
          </h3>
        </div>

        <div class="score-card-body">
          <p class="score-composer">
            ${
              score.composer
                ? this.escapeHtml(score.composer)
                : 'Unknown composer'
            }
          </p>

          ${
            score.description
              ? `
            <p class="score-description">${this.escapeHtml(
              score.description,
            )}</p>
          `
              : ''
          }
        </div>

        <div class="score-card-footer">
          <span class="score-stat" title="Fork count">${renderIcon(
            'git-fork',
          )} ${score.fork_count}</span>
          <span class="score-stat" title="Created date"><relative-time datetime="${score.created_at}" format="relative"></relative-time></span>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Search input
    const searchInput = this.container.querySelector(
      '#search-input',
    ) as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      this.handleSearch((e.target as HTMLInputElement).value);
    });

    // Score cards
    const scoreCards = this.container.querySelectorAll('.score-card');
    scoreCards.forEach((card) => {
      card.addEventListener('click', () => {
        const scoreSlug = card.getAttribute('data-score-slug');
        if (scoreSlug) {
          this.handleScoreClick(scoreSlug);
        }
      });
    });

    // Clear filters button
    const clearFiltersBtn = this.container.querySelector('#clear-filters-btn');
    clearFiltersBtn?.addEventListener('click', () => {
      this.searchQuery = '';
      this.applyFilters();
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private addStyles(): void {
    if (document.getElementById('score-library-styles')) return;

    const style = document.createElement('style');
    style.id = 'score-library-styles';
    style.textContent = `
      .score-library {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--spacing-large);
      }

      .score-library-filters {
        background: var(--panel-background-color);
        border: var(--panel-border-width) solid var(--panel-border-color);
        padding: var(--spacing-large);
        border-radius: var(--border-radius-large);
        margin-bottom: var(--spacing-x-large);
      }

      .score-count {
        color: var(--color-text-secondary);
        font-size: var(--font-size-small);
        margin-top: var(--spacing-small);
        margin-bottom: 0;
      }

      .search-bar {
        margin: 0;
      }

      .search-bar input {
        width: 100%;
        padding: var(--input-spacing-small);
        border: var(--input-border-width) solid var(--input-border-color);
        border-radius: var(--input-border-radius-medium);
        font-size: var(--input-font-size-medium);
        background: var(--input-background-color);
        color: var(--input-color);
        transition: border-color var(--transition-fast);
        box-sizing: border-box;
      }

      .search-bar input:hover {
        border-color: var(--input-border-color-hover);
      }

      .search-bar input:focus {
        outline: none;
        border-color: var(--input-border-color-focus);
        box-shadow: 0 0 0 var(--input-focus-ring-offset) var(--input-focus-ring-color);
      }

      .search-bar input::placeholder {
        color: var(--input-placeholder-color);
      }

      .filter-group {
        margin-bottom: var(--spacing-medium);
      }

      .filter-group:last-child {
        margin-bottom: 0;
      }

      .filter-group label {
        display: block;
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-x-small);
        color: var(--color-text-primary);
      }

      .filter-group select {
        padding: var(--spacing-x-small) var(--spacing-small);
        border: var(--input-border-width) solid var(--input-border-color);
        border-radius: var(--input-border-radius-medium);
        font-size: var(--input-font-size-medium);
        min-width: 200px;
        background: var(--input-background-color);
        color: var(--input-color);
      }

      .score-library-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-large);
      }

      .score-card {
        background: var(--panel-background-color);
        border: var(--panel-border-width) solid var(--panel-border-color);
        border-radius: var(--border-radius-large);
        padding: var(--spacing-large);
        cursor: pointer;
        transition: transform var(--transition-fast), box-shadow var(--transition-fast);
      }

      .score-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-large);
      }

      .score-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-small);
        gap: var(--spacing-small);
      }

      .score-title {
        font-size: var(--font-size-large);
        margin: 0;
        color: var(--color-text-primary);
        flex: 1;
        display: flex;
        align-items: center;
        gap: var(--spacing-x-small);
      }

      .forked-indicator {
        display: inline-flex;
        align-items: center;
        color: var(--color-text-secondary);
      }

      .forked-indicator svg {
        width: 16px;
        height: 16px;
      }

      .score-card-body {
        margin-bottom: var(--spacing-medium);
      }

      .score-composer {
        color: var(--color-text-secondary);
        margin: 0 0 var(--spacing-small) 0;
        font-style: italic;
      }

      .score-description {
        color: var(--color-text-primary);
        font-size: var(--font-size-small);
        margin: var(--spacing-small) 0;
        line-height: var(--line-height-dense);
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .score-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--spacing-small);
        border-top: var(--panel-border-width) solid var(--color-border-subtle);
        font-size: var(--font-size-x-small);
        color: var(--color-text-secondary);
      }

      .score-stat {
        display: flex;
        align-items: center;
        gap: var(--spacing-2x-small);
      }

      .score-stat svg {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
      }

      .no-scores {
        grid-column: 1 / -1;
        text-align: center;
        padding: var(--spacing-3x-large) var(--spacing-large);
        color: var(--color-text-tertiary);
      }

      .no-scores p {
        font-size: var(--font-size-large);
        margin-bottom: var(--spacing-large);
      }

      .no-scores button,
      .score-library-error button {
        background: var(--color-primary-600);
        color: var(--color-text-on-dark);
        border: none;
        padding: var(--spacing-x-small) var(--spacing-small);
        border-radius: var(--border-radius-medium);
        cursor: pointer;
        font-size: var(--font-size-small);
        transition: background var(--transition-fast);
      }

      .no-scores button:hover,
      .score-library-error button:hover {
        background: var(--color-primary-700);
      }

      .score-library-loading {
        text-align: center;
        padding: var(--spacing-3x-large) var(--spacing-large);
      }

      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid var(--color-spinner-track);
        border-top: 4px solid var(--color-primary-600);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto var(--spacing-large);
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .score-library-error {
        text-align: center;
        padding: var(--spacing-3x-large) var(--spacing-large);
        color: var(--color-text-danger);
      }

      .score-library-error h2 {
        margin-bottom: var(--spacing-small);
      }

      .score-library-error p {
        margin-bottom: var(--spacing-large);
        color: var(--color-text-secondary);
      }

      @media (max-width: 768px) {
        .score-library {
          padding: var(--spacing-medium);
        }

        .score-library-grid {
          grid-template-columns: 1fr;
        }

        .filter-group select {
          width: 100%;
          min-width: 0;
        }
      }
    `;

    document.head.appendChild(style);
  }

  public refresh(): void {
    this.loadScores();
  }
}
