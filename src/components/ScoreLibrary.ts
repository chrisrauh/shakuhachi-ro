import { getAllScores, getUserScores } from '../api/scores';
import type { Score } from '../api/scores';
import { Search, CircleX, GitFork, ChevronRight, ChevronDown } from 'lucide';
import { getIconHTML } from '../utils/icons';
import { onAuthReady } from '../api/auth';
import type { User } from '@supabase/supabase-js';
import '@github/relative-time-element';
import { STRING_FACTORIES } from '../constants/strings';
import { SCHOOLS, composerLine } from '../utils/school';

type Tab = 'library' | 'mine';
type Sort = 'recent' | 'title';

/** Rows the loading state shows. About one screen of a phone. */
const SKELETON_ROWS = 8;

export class ScoreLibrary {
  private container: HTMLElement;
  private currentUser: User | null = null;
  private myScores: Score[] = [];
  private libraryScores: Score[] = [];
  private tab: Tab = 'library';
  private sort: Sort = 'recent';
  private searchQuery: string = '';
  // Loading from the start, so the first render shows the skeleton, not
  // "No scores in the library yet" before auth settles
  private isLoading: boolean = true;
  private error: Error | null = null;
  private authSubscription?: { unsubscribe: () => void };
  private holdLoading: boolean;

  /**
   * @param options.holdLoading - Show the loading state and never load
   *   scores, to check the skeleton in place (index.astro sets it from
   *   `?loading` in the URL)
   */
  constructor(containerId: string, { holdLoading = false } = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(STRING_FACTORIES.containerNotFound(containerId));
    }
    this.container = container;
    this.holdLoading = holdLoading;

    // Subscribe to auth state changes using onAuthReady
    // Handles Supabase's quirky event ordering automatically
    this.authSubscription = onAuthReady((user) => {
      const userChanged = this.currentUser?.id !== user?.id;
      this.currentUser = user;
      if (!user) this.tab = 'library';
      if (userChanged || !this.libraryScores.length) {
        this.loadScores();
      }
    });

    this.render();
  }

  private async loadScores(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.render();
    if (this.holdLoading) return;

    const [library, mine] = await Promise.all([
      getAllScores(),
      this.currentUser ? getUserScores(this.currentUser.id) : null,
    ]);

    this.isLoading = false;
    this.error = library.error ?? mine?.error ?? null;
    if (!this.error) {
      this.libraryScores = library.scores;
      this.myScores = mine?.scores ?? [];
    }
    this.render();
  }

  /** The scores of the open tab that match the search, in the chosen order. */
  private visibleScores(): Score[] {
    const query = this.searchQuery.toLowerCase();
    const matches = (score: Score) =>
      [score.title, score.composer, score.school && SCHOOLS[score.school]].some(
        (text) => text?.toLowerCase().includes(query),
      );
    const scores = (
      this.tab === 'mine' ? this.myScores : this.libraryScores
    ).filter(matches);
    return this.sort === 'title'
      ? scores.sort((a, b) => a.title.localeCompare(b.title))
      : scores.sort(
          (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
        );
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="score-library">
        <div class="library-toolbar">
          ${this.currentUser ? this.renderTabs() : ''}
          <div class="library-search">
            <span class="library-search-icon" aria-hidden="true">${getIconHTML(Search)}</span>
            <input
              type="search"
              id="search-input"
              placeholder="Search"
              aria-label="Search by title, composer or school"
            />
            <button
              class="library-search-clear"
              id="search-clear-btn"
              aria-label="Clear search"
              title="Clear the search field"
              type="button"
              ${this.searchQuery ? '' : 'hidden'}
            >${getIconHTML(CircleX)}</button>
          </div>
          <label class="library-sort">
            <span>Sort:</span>
            <select id="sort-select">
              <option value="recent"${this.sort === 'recent' ? ' selected' : ''}>Recent</option>
              <option value="title"${this.sort === 'title' ? ' selected' : ''}>Title</option>
            </select>
            <span class="library-sort-icon" aria-hidden="true">${getIconHTML(ChevronDown)}</span>
          </label>
        </div>
        <div class="library-list" id="score-list">
          ${this.renderListContent()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderTabs(): string {
    const option = (tab: Tab, label: string) =>
      `<button type="button" class="segmented-option" data-tab="${tab}" aria-pressed="${this.tab === tab}">${label}</button>`;
    return `
      <div class="segmented library-tabs" role="group" aria-label="Scores to show">
        ${option('library', 'Library')}${option('mine', 'My Scores')}
      </div>
    `;
  }

  /** Redraws the list alone, so the search field keeps its focus. */
  private renderList(): void {
    const list = this.container.querySelector('#score-list');
    if (!list) return;
    list.innerHTML = this.renderListContent();
    this.container
      .querySelector('#search-clear-btn')
      ?.toggleAttribute('hidden', !this.searchQuery);
    this.attachRetryListener();
  }

  private renderListContent(): string {
    if (this.isLoading) {
      return this.renderSkeleton();
    }

    if (this.error) {
      return `
        <div class="page-error">
          <p>${this.escapeHtml(this.error.message)}</p>
          <button id="retry-btn" class="btn btn-small btn-primary"><span class="btn-text">Retry</span></button>
        </div>
      `;
    }

    if (this.tab === 'mine' && this.myScores.length === 0) {
      return `
        <div class="library-empty">
          <p>You haven't created any scores yet.</p>
          <p><a href="/score/new/edit">Create your first score</a></p>
        </div>
      `;
    }

    const scores = this.visibleScores();
    if (scores.length === 0) {
      return this.renderNoScores(
        this.searchQuery
          ? `No scores found matching "${this.escapeHtml(this.searchQuery)}"`
          : 'No scores in the library yet',
      );
    }

    return scores.map((score) => this.renderRow(score)).join('');
  }

  /** Grey rows shaped like the loaded ones, shown while scores load. */
  private renderSkeleton(): string {
    const row = `
      <div class="library-row library-row-skeleton">
        <div class="library-row-main">
          <span class="skeleton skeleton-title"></span>
          <span class="skeleton skeleton-description"></span>
        </div>
        <span class="library-row-cell"><span class="skeleton skeleton-cell"></span></span>
        <span class="library-row-cell"><span class="skeleton skeleton-cell"></span></span>
        <span class="library-row-cell"><span class="skeleton skeleton-cell"></span></span>
        <span class="library-row-cell"><span class="skeleton skeleton-cell"></span></span>
      </div>
    `;
    return `<div class="library-skeleton" role="status" aria-label="Loading scores">${row.repeat(SKELETON_ROWS)}</div>`;
  }

  private renderNoScores(message: string): string {
    return `
      <div class="no-scores">
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * One score as a row. On a wide screen the composer, school, forks and date
   * are columns. On a phone they are hidden, and the row shows the date beside
   * the title and the composer before the description.
   */
  private renderRow(score: Score): string {
    const updated = `<relative-time datetime="${score.updated_at}" format="relative"></relative-time>`;
    const byline = this.escapeHtml(composerLine(score.composer, score.school));
    const description = score.description
      ? this.escapeHtml(score.description)
      : '';
    return `
      <a class="library-row" href="/score/${encodeURIComponent(score.slug)}">
        <div class="library-row-main">
          <p class="library-row-title">
            <span class="library-row-title-text">${this.escapeHtml(score.title)}</span>
            <span class="library-row-title-date">${updated}</span>
          </p>
          <p class="library-row-description"><span class="library-row-byline">${byline}${description ? ' · ' : ''}</span>${description || '&nbsp;'}</p>
        </div>
        <span class="library-row-cell">${this.escapeHtml(score.composer?.trim() || 'Unknown composer')}</span>
        <span class="library-row-cell${score.school ? '' : ' library-row-cell-empty'}">${score.school ? SCHOOLS[score.school] : '—'}</span>
        <span class="library-row-cell library-row-forks${score.fork_count ? '' : ' library-row-cell-empty'}" title="Forks">${getIconHTML(GitFork)}<span class="library-row-count">${score.fork_count}</span></span>
        <span class="library-row-cell library-row-cell-empty">${updated}</span>
        <span class="library-row-chevron" aria-hidden="true">${getIconHTML(ChevronRight)}</span>
      </a>
    `;
  }

  private clearSearch(): void {
    this.searchQuery = '';
    this.renderList();
    const input = this.container.querySelector(
      '#search-input',
    ) as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  private attachEventListeners(): void {
    const searchInput = this.container.querySelector(
      '#search-input',
    ) as HTMLInputElement | null;

    // Restore the query as a property, not a value="" attribute: escapeHtml does
    // not escape quotes, so interpolating it into the markup would let a typed `"`
    // break out of the attribute.
    if (searchInput) {
      searchInput.value = this.searchQuery;
    }

    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.renderList();
    });

    searchInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.searchQuery) {
        this.clearSearch();
      }
    });

    this.container
      .querySelector('#search-clear-btn')
      ?.addEventListener('click', () => this.clearSearch());

    this.container
      .querySelector('#sort-select')
      ?.addEventListener('change', (e) => {
        this.sort = (e.target as HTMLSelectElement).value as Sort;
        this.renderList();
      });

    this.container
      .querySelectorAll<HTMLButtonElement>('.library-tabs [data-tab]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          this.tab = button.dataset.tab as Tab;
          this.container
            .querySelectorAll('.library-tabs [data-tab]')
            .forEach((b) =>
              b.setAttribute('aria-pressed', String(b === button)),
            );
          this.renderList();
        });
      });

    this.attachRetryListener();
  }

  private attachRetryListener(): void {
    this.container
      .querySelector('#retry-btn')
      ?.addEventListener('click', () => this.loadScores());
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
