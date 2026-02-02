import { getAllScores } from '../api/scores';
import type { Score, ScoreDifficulty } from '../api/scores';
import { renderIcon, initIcons } from '../utils/icons';

export class ScoreLibrary {
  private container: HTMLElement;
  private scores: Score[] = [];
  private filteredScores: Score[] = [];
  private searchQuery: string = '';
  private difficultyFilter: ScoreDifficulty | 'all' = 'all';
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
          (score.composer && score.composer.toLowerCase().includes(query))
      );
    }

    // Apply difficulty filter
    if (this.difficultyFilter !== 'all') {
      filtered = filtered.filter(
        (score) => score.difficulty === this.difficultyFilter
      );
    }

    this.filteredScores = filtered;
    this.renderGrid();
  }

  private handleSearch(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  private handleDifficultyFilter(difficulty: ScoreDifficulty | 'all'): void {
    this.difficultyFilter = difficulty;
    this.applyFilters();
  }

  private handleScoreClick(scoreSlug: string): void {
    // Navigate to score detail page
    window.location.href = `/score.html?slug=${scoreSlug}`;
  }

  private getDifficultyBadgeColor(difficulty: ScoreDifficulty | null): string {
    switch (difficulty) {
      case 'beginner':
        return '#4caf50';
      case 'intermediate':
        return '#ff9800';
      case 'advanced':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
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
        <div class="score-library-header">
          <h1>Score Library</h1>
          <p class="score-count" id="score-count">${this.filteredScores.length} ${this.filteredScores.length === 1 ? 'score' : 'scores'}</p>
        </div>

        <div class="score-library-filters">
          <div class="search-bar">
            <input
              type="text"
              id="search-input"
              placeholder="Search by title or composer..."
              value="${this.searchQuery}"
            />
          </div>

          <div class="filter-group">
            <label>Difficulty:</label>
            <select id="difficulty-filter">
              <option value="all" ${this.difficultyFilter === 'all' ? 'selected' : ''}>All</option>
              <option value="beginner" ${this.difficultyFilter === 'beginner' ? 'selected' : ''}>Beginner</option>
              <option value="intermediate" ${this.difficultyFilter === 'intermediate' ? 'selected' : ''}>Intermediate</option>
              <option value="advanced" ${this.difficultyFilter === 'advanced' ? 'selected' : ''}>Advanced</option>
            </select>
          </div>
        </div>

        <div class="score-library-grid" id="score-grid">
          ${this.filteredScores.length === 0 ? `
            <div class="no-scores">
              <p>No scores found</p>
              ${this.searchQuery || this.difficultyFilter !== 'all' ? `
                <button id="clear-filters-btn">Clear Filters</button>
              ` : ''}
            </div>
          ` : this.filteredScores.map((score) => this.renderScoreCard(score)).join('')}
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
    countElement.textContent = `${this.filteredScores.length} ${this.filteredScores.length === 1 ? 'score' : 'scores'}`;

    // Update grid
    gridElement.innerHTML = this.filteredScores.length === 0 ? `
      <div class="no-scores">
        <p>No scores found</p>
        ${this.searchQuery || this.difficultyFilter !== 'all' ? `
          <button id="clear-filters-btn">Clear Filters</button>
        ` : ''}
      </div>
    ` : this.filteredScores.map((score) => this.renderScoreCard(score)).join('');

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
      this.difficultyFilter = 'all';
      this.applyFilters();

      // Update UI controls
      const searchInput = this.container.querySelector('#search-input') as HTMLInputElement;
      const difficultyFilter = this.container.querySelector('#difficulty-filter') as HTMLSelectElement;
      if (searchInput) searchInput.value = '';
      if (difficultyFilter) difficultyFilter.value = 'all';
    });
  }

  private renderScoreCard(score: Score): string {
    const difficultyColor = this.getDifficultyBadgeColor(score.difficulty);

    return `
      <div class="score-card" data-score-slug="${score.slug}">
        <div class="score-card-header">
          <h3 class="score-title">
            ${score.forked_from ? `<span class="forked-indicator" title="This is a forked score">${renderIcon('git-fork')}</span>` : ''}
            ${this.escapeHtml(score.title)}
          </h3>
          ${score.difficulty ? `
            <span class="difficulty-badge" style="background-color: ${difficultyColor}">
              ${score.difficulty}
            </span>
          ` : ''}
        </div>

        <div class="score-card-body">
          <p class="score-composer">
            ${score.composer ? this.escapeHtml(score.composer) : 'Unknown composer'}
          </p>

          ${score.description ? `
            <p class="score-description">${this.escapeHtml(score.description)}</p>
          ` : ''}
        </div>

        <div class="score-card-footer">
          <span class="score-stat" title="Fork count">${renderIcon('git-fork')} ${score.fork_count}</span>
          <span class="score-stat" title="View count">${renderIcon('eye')} ${score.view_count}</span>
          <span class="score-stat" title="Created date">${renderIcon('calendar')} ${this.formatDate(score.created_at)}</span>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Search input
    const searchInput = this.container.querySelector('#search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      this.handleSearch((e.target as HTMLInputElement).value);
    });

    // Difficulty filter
    const difficultyFilter = this.container.querySelector('#difficulty-filter') as HTMLSelectElement;
    difficultyFilter?.addEventListener('change', (e) => {
      this.handleDifficultyFilter((e.target as HTMLSelectElement).value as ScoreDifficulty | 'all');
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
      this.difficultyFilter = 'all';
      this.applyFilters();
    });
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
    if (document.getElementById('score-library-styles')) return;

    const style = document.createElement('style');
    style.id = 'score-library-styles';
    style.textContent = `
      .score-library {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .score-library-header {
        margin-bottom: 30px;
      }

      .score-library-header h1 {
        font-size: 2rem;
        margin-bottom: 5px;
      }

      .score-count {
        color: #666;
        font-size: 0.9rem;
      }

      .score-library-filters {
        background: #f5f5f5;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
      }

      .search-bar {
        margin-bottom: 15px;
      }

      .search-bar input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      .filter-group {
        margin-bottom: 15px;
      }

      .filter-group:last-child {
        margin-bottom: 0;
      }

      .filter-group label {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
        color: #333;
      }

      .filter-group select {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        min-width: 200px;
      }

      .score-library-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }

      .score-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .score-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .score-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
        gap: 10px;
      }

      .score-title {
        font-size: 1.2rem;
        margin: 0;
        color: #333;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .forked-indicator {
        display: inline-flex;
        align-items: center;
        color: #2196f3;
      }

      .forked-indicator svg {
        width: 16px;
        height: 16px;
      }

      .difficulty-badge {
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        color: white;
        text-transform: capitalize;
        white-space: nowrap;
      }

      .score-card-body {
        margin-bottom: 15px;
      }

      .score-composer {
        color: #666;
        margin: 0 0 10px 0;
        font-style: italic;
      }

      .score-description {
        color: #555;
        font-size: 0.9rem;
        margin: 10px 0;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .score-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12px;
        border-top: 1px solid #f0f0f0;
        font-size: 0.85rem;
        color: #666;
      }

      .score-stat {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .score-stat svg {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
      }

      .no-scores {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: #999;
      }

      .no-scores p {
        font-size: 1.2rem;
        margin-bottom: 20px;
      }

      .no-scores button,
      .score-library-error button {
        background: #2196f3;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
      }

      .no-scores button:hover,
      .score-library-error button:hover {
        background: #1976d2;
      }

      .score-library-loading {
        text-align: center;
        padding: 60px 20px;
      }

      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #2196f3;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .score-library-error {
        text-align: center;
        padding: 60px 20px;
        color: #f44336;
      }

      .score-library-error h2 {
        margin-bottom: 10px;
      }

      .score-library-error p {
        margin-bottom: 20px;
        color: #666;
      }

      @media (max-width: 768px) {
        .score-library {
          padding: 15px;
        }

        .score-library-header h1 {
          font-size: 1.5rem;
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
