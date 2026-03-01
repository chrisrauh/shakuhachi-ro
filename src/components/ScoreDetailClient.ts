import { MusicXMLParser } from '../web-component/parser/MusicXMLParser';
import { forkScore, deleteScore } from '../api/scores';
import { onAuthReady, getCurrentUser } from '../api/auth';
import { ConfirmDialog } from './ConfirmDialog';
import { showNotification } from './Notification';
import type { Score } from '../api/scores';
import type { User } from '@supabase/supabase-js';
import type { ScoreData as RendererScoreData } from '../web-component/types/ScoreData';

interface ScoreData {
  score: Score;
  parentScore: Score | null;
}

export class ScoreDetailClient {
  private score: Score | null = null;
  private currentUser: User | null = null;

  constructor() {
    // Read embedded data
    const dataEl = document.getElementById('score-data');
    if (dataEl) {
      try {
        const data = JSON.parse(dataEl.textContent || '{}') as ScoreData;
        this.score = data.score;
        // parentScore is rendered server-side, no need to store client-side
      } catch (error) {
        console.error('Failed to parse score data:', error);
      }
    }
  }

  async init() {
    if (!this.score) {
      console.error('No score data found');
      return;
    }

    // Subscribe to auth state changes using onAuthReady
    // Handles Supabase's quirky event ordering automatically
    onAuthReady((user) => {
      const userChanged = this.currentUser?.id !== user?.id;
      this.currentUser = user;
      if (userChanged) {
        this.handleEditButtonVisibility(user);
      }
    });

    // Render score visualization
    await this.renderScore();

    // Attach event listeners
    this.attachEventListeners();

    // Listen for theme changes and re-render score
    this.setupThemeListener();
  }

  private handleEditButtonVisibility(user: User | null) {
    if (!this.score) return;

    const isOwner = !!(user && user.id === this.score.user_id);

    const editBtn = document.getElementById('edit-btn') as HTMLElement;
    if (editBtn) {
      editBtn.style.display = isOwner ? 'inline-flex' : 'none';
    }

    const deleteBtn = document.getElementById('delete-btn') as HTMLElement;
    if (deleteBtn) {
      deleteBtn.style.display = isOwner ? 'inline-flex' : 'none';
    }
  }

  private async renderScore() {
    const container = document.getElementById('score-renderer') as HTMLElement;
    if (!container || !this.score) return;

    try {
      // Convert score data to ScoreData format based on data_format
      let scoreData: RendererScoreData;

      if (this.score.data_format === 'json') {
        scoreData = this.score.data as RendererScoreData;
      } else if (this.score.data_format === 'musicxml') {
        // Parse MusicXML string to ScoreData
        scoreData = MusicXMLParser.parse(this.score.data as string);
      } else if (this.score.data_format === 'abc') {
        // Parse ABC notation to ScoreData
        const { ABCParser } = await import('../web-component/parser/ABCParser');
        scoreData = ABCParser.parse(this.score.data as string);
      } else {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <p>Unsupported format: ${this.score.data_format}</p>
          </div>
        `;
        return;
      }

      // Detect mobile viewport
      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      // Read theme-aware colors from CSS variables
      const noteColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-text-primary')
        .trim();

      // Set CSS variables for theme colors BEFORE setting attributes
      // (setting data-score attribute triggers render, so CSS vars must be ready)
      container.style.setProperty(
        '--shakuhachi-note-color',
        noteColor || '#000',
      );
      container.style.setProperty(
        '--shakuhachi-note-vertical-spacing',
        isMobile ? '40px' : '44px',
      );

      if (isMobile) {
        // Mobile: single-column mode with intrinsic height (fits content for scrolling)
        container.setAttribute('columns', '1');
        container.style.width = '100%';
      } else {
        // Desktop: auto-detect columns based on viewport height
        container.setAttribute('columns', 'auto');
        container.style.width = '100%';
        container.style.height = '100%';
      }

      // Set web component attributes (triggers render)
      // This MUST come after width/height attributes are set
      container.setAttribute('data-score', JSON.stringify(scoreData));
    } catch (error) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--color-text-danger);">
          <p>Error rendering score: ${
            error instanceof Error ? error.message : 'Unknown error'
          }</p>
        </div>
      `;
    }
  }

  private setupThemeListener(): void {
    // Use MutationObserver to watch for theme attribute changes on <html>
    const observer = new MutationObserver(() => {
      // Re-render score when theme changes
      const container = document.getElementById('score-renderer') as any;
      if (container && container.forceRender) {
        // Update CSS variable first
        const noteColor = getComputedStyle(document.documentElement)
          .getPropertyValue('--color-text-primary')
          .trim();
        container.style.setProperty(
          '--shakuhachi-note-color',
          noteColor || '#000',
        );

        // Force web component to re-render with new theme
        container.forceRender();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  private attachEventListeners() {
    const forkBtn = document.getElementById('fork-btn');
    if (forkBtn) {
      forkBtn.addEventListener('click', () => this.handleFork());
    }

    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.handleDelete());
    }
  }

  private handleDelete() {
    if (!this.score) return;

    const dialog = new ConfirmDialog();
    dialog.show({
      title: 'Delete score',
      message: `Delete '${this.score.title}'? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => this.performDelete(),
    });
  }

  private async performDelete() {
    if (!this.score) return;

    const deleteBtn = document.getElementById(
      'delete-btn',
    ) as HTMLButtonElement;
    if (deleteBtn) deleteBtn.disabled = true;

    const result = await deleteScore(this.score.id);
    if (result.error) {
      showNotification(
        `Error deleting score: ${result.error.message}`,
        'error',
      );
      if (deleteBtn) deleteBtn.disabled = false;
      return;
    }

    sessionStorage.setItem('score-deleted', this.score.title);
    window.location.href = '/';
  }

  private async handleFork() {
    if (!this.score) return;

    const { user } = await getCurrentUser();
    if (!user) {
      showNotification('Please sign in to fork this score', 'error');
      return;
    }

    // Show confirmation dialog
    const dialog = new ConfirmDialog();
    dialog.show({
      title: 'Fork score',
      message: `Fork '${this.score.title}'? This creates your own editable copy.`,
      confirmText: 'Fork',
      cancelText: 'Cancel',
      onConfirm: () => this.performFork(),
    });
  }

  private async performFork() {
    if (!this.score) return;

    // Disable the fork button to prevent double-clicks
    const forkBtn = document.getElementById('fork-btn') as HTMLButtonElement;
    const originalContent = forkBtn?.innerHTML;

    if (forkBtn) {
      forkBtn.disabled = true;
      // Update to show loading state while preserving structure (icon + loading indicator)
      forkBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" stroke-dasharray="15.7" stroke-dashoffset="0">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
        <span class="count">⋯</span>
      `;
    }

    try {
      const result = await forkScore(this.score.id);
      if (result.error) {
        showNotification(
          `Error forking score: ${result.error.message}`,
          'error',
        );
        if (forkBtn && originalContent) {
          forkBtn.disabled = false;
          forkBtn.innerHTML = originalContent;
        }
        return;
      }

      if (result.score) {
        // Redirect to editor with the forked score
        window.location.href = `/editor.html?id=${result.score.id}`;
      }
    } catch {
      showNotification('Failed to fork score', 'error');
      if (forkBtn && originalContent) {
        forkBtn.disabled = false;
        forkBtn.innerHTML = originalContent;
      }
    }
  }
}
