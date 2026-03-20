import { getAllScores, getUserScores } from '../api/scores';
import type { Score } from '../api/scores';
import { Search, CircleX } from 'lucide';
import { renderIcon, initIcons, getIconHTML } from '../utils/icons';
import { onAuthReady } from '../api/auth';
import type { User } from '@supabase/supabase-js';
import '@github/relative-time-element';
import { STRING_FACTORIES } from '../constants/strings';
import { buildSpinnerSVG } from './LoadingSpinner';

export class ScoreLibrary {
  private container: HTMLElement;
  private currentUser: User | null = null;
  private myScores: Score[] = [];
  private libraryScores: Score[] = [];
  private filteredMyScores: Score[] = [];
  private filteredLibraryScores: Score[] = [];
  private searchQuery: string = '';
  private isLoading: boolean = false;
  private error: Error | null = null;
  private authSubscription?: { unsubscribe: () => void };

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(STRING_FACTORIES.containerNotFound(containerId));
    }
    this.container = container;

    // Subscribe to auth state changes using onAuthReady
    // Handles Supabase's quirky event ordering automatically
    this.authSubscription = onAuthReady((user) => {
      const userChanged = this.currentUser?.id !== user?.id;
      this.currentUser = user;
      if (userChanged || !this.myScores.length) {
        this.loadScores();
      }
    });

    this.render();
  }

  private async loadScores(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.render();

    // Fetch user's scores if logged in
    if (this.currentUser) {
      const { scores: userScores, error: userError } = await getUserScores(
        this.currentUser.id,
      );
      if (userError) {
        this.error = userError;
        this.isLoading = false;
        this.render();
        return;
      }
      this.myScores = userScores || [];
    } else {
      this.myScores = [];
    }

    // Fetch all scores
    const result = await getAllScores();

    this.isLoading = false;

    if (result.error) {
      this.error = result.error;
    } else {
      // If authenticated, filter out user's scores from library
      this.libraryScores = this.currentUser
        ? result.scores.filter(
            (score) => score.user_id !== this.currentUser!.id,
          )
        : result.scores;
    }

    this.applyFilters();
    this.render();
  }

  private applyFilters(): void {
    const query = this.searchQuery.toLowerCase();

    // Filter user's scores
    this.filteredMyScores = this.myScores.filter(
      (score) =>
        score.title.toLowerCase().includes(query) ||
        (score.composer && score.composer.toLowerCase().includes(query)),
    );

    // Filter library scores
    this.filteredLibraryScores = this.libraryScores.filter(
      (score) =>
        score.title.toLowerCase().includes(query) ||
        (score.composer && score.composer.toLowerCase().includes(query)),
    );

    this.renderGrid();
  }

  private handleSearch(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  private handleScoreClick(scoreSlug: string): void {
    // Navigate to score detail page
    window.location.href = `/score/${encodeURIComponent(scoreSlug)}`;
  }

  private render(): void {
    if (this.isLoading) {
      this.container.innerHTML = `
        <div class="score-library-loading">
          ${buildSpinnerSVG()}
          <p>Loading scores...</p>
        </div>
      `;
      return;
    }

    if (this.error) {
      this.container.innerHTML = `
        <div class="score-library-error">
          <h2>Error Loading Scores</h2>
          <p>${this.error.message}</p>
          <button id="retry-btn" class="btn btn-small btn-primary"><span class="btn-text">Retry</span></button>
        </div>
      `;

      const retryBtn = this.container.querySelector('#retry-btn');
      retryBtn?.addEventListener('click', () => this.loadScores());
      return;
    }

    this.container.innerHTML = `
      <div class="score-library">
        <div class="search-bar">
          <div class="search-bar-field">
            <span class="search-bar-icon" aria-hidden="true">${getIconHTML(Search)}</span>
            <input
              type="text"
              id="search-input"
              placeholder="Search by title or composer..."
              value="${this.searchQuery}"
            />
            <button
              class="search-bar-clear"
              id="search-clear-btn"
              aria-label="Clear search"
              ${this.searchQuery ? '' : 'hidden'}
            >${getIconHTML(CircleX)}</button>
          </div>
        </div>

        <div class="score-library-grid" id="score-grid">
          ${this.renderGridContent()}
        </div>
      </div>
    `;

    this.attachEventListeners();
    initIcons();
  }

  private renderGrid(): void {
    const gridElement = this.container.querySelector('#score-grid');

    if (!gridElement) {
      // Fallback to full render if grid not found
      this.render();
      return;
    }

    // Update grid with new content
    gridElement.innerHTML = this.renderGridContent();

    // Initialize icons
    initIcons();

    // Reattach score card listeners
    this.attachScoreCardListeners(gridElement);

    // Reattach create score link listener if present
    const createScoreLink = gridElement.querySelector('.create-score-link');
    createScoreLink?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/score/new/edit';
    });

    this.updateClearButton();
  }

  private renderNoScores(message: string): string {
    return `
      <div class="no-scores">
        <p>${message}</p>
      </div>
    `;
  }

  private updateClearButton(): void {
    const btn = this.container.querySelector(
      '#search-clear-btn',
    ) as HTMLButtonElement | null;
    if (!btn) return;
    btn.hidden = !this.searchQuery;
  }

  private clearSearch(): void {
    this.handleSearch('');
    const input = this.container.querySelector(
      '#search-input',
    ) as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  private renderGridContent(): string {
    // User logged in with scores - show two sections
    if (this.currentUser && this.myScores.length > 0) {
      return `
        <div class="section-header">
          <h2>My Scores</h2>
          <div class="section-count">${this.filteredMyScores.length} ${
            this.filteredMyScores.length === 1 ? 'score' : 'scores'
          }</div>
        </div>
        <div class="score-grid-section">
          ${
            this.filteredMyScores.length === 0
              ? this.renderNoScores(
                  `No scores found matching "${this.escapeHtml(this.searchQuery)}"`,
                )
              : this.filteredMyScores
                  .map((score) => this.renderScoreCard(score))
                  .join('')
          }
        </div>

        <div class="section-header">
          <h2>Library</h2>
          <div class="section-count">${this.filteredLibraryScores.length} ${
            this.filteredLibraryScores.length === 1 ? 'score' : 'scores'
          }</div>
        </div>
        <div class="score-grid-section">
          ${
            this.filteredLibraryScores.length === 0
              ? this.renderNoScores(
                  this.searchQuery
                    ? `No scores found matching "${this.escapeHtml(this.searchQuery)}"`
                    : 'No scores in the library yet',
                )
              : this.filteredLibraryScores
                  .map((score) => this.renderScoreCard(score))
                  .join('')
          }
        </div>
      `;
    }

    // User logged in but no scores - show empty state + library
    if (this.currentUser && this.myScores.length === 0) {
      return `
        <div class="empty-state">
          <p>You haven't created any scores yet.</p>
          <p><a href="/score/new/edit" class="create-score-link">Create your first score</a></p>
        </div>

        ${
          this.libraryScores.length > 0
            ? `
          <div class="section-header">
            <h2>Library</h2>
            <div class="section-count">${this.filteredLibraryScores.length} ${
              this.filteredLibraryScores.length === 1 ? 'score' : 'scores'
            }</div>
          </div>
          <div class="score-grid-section">
            ${this.filteredLibraryScores
              .map((score) => this.renderScoreCard(score))
              .join('')}
          </div>
        `
            : ''
        }
      `;
    }

    // User not logged in - show single section
    return `
      <div class="score-grid-section">
        ${
          this.filteredLibraryScores.length === 0
            ? this.renderNoScores(
                this.searchQuery
                  ? `No scores found matching "${this.escapeHtml(this.searchQuery)}"`
                  : 'No scores in the library yet',
              )
            : this.filteredLibraryScores
                .map((score) => this.renderScoreCard(score))
                .join('')
        }
      </div>
    `;
  }

  private attachScoreCardListeners(container: Element): void {
    const scoreCards = container.querySelectorAll('.score-card');
    scoreCards.forEach((card) => {
      card.addEventListener('click', () => {
        const scoreSlug = card.getAttribute('data-score-slug');
        if (scoreSlug) {
          this.handleScoreClick(scoreSlug);
        }
      });
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
            ${
              score.rights
                ? `<span class="badge-public-domain">${this.escapeHtml(score.rights)}</span>`
                : ''
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

    // Clear button click
    const clearBtn = this.container.querySelector('#search-clear-btn');
    clearBtn?.addEventListener('click', () => {
      this.clearSearch();
    });

    // Escape key on search input
    searchInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.searchQuery) {
        this.clearSearch();
      }
    });

    // Score cards
    this.attachScoreCardListeners(this.container);

    // Create score link
    const createScoreLink = this.container.querySelector('.create-score-link');
    createScoreLink?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/score/new/edit';
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public refresh(): void {
    this.loadScores();
  }

  public destroy(): void {
    // Unsubscribe from auth state changes
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
