import { MusicXMLParser } from '../parser/MusicXMLParser';
import { forkScore } from '../api/scores';
import { onAuthReady, getCurrentUser } from '../api/auth';
import { ConfirmDialog } from './ConfirmDialog';
import type { Score } from '../api/scores';
import type { User } from '@supabase/supabase-js';
import type { ScoreData as RendererScoreData } from '../types/ScoreData';

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

    const editBtn = document.getElementById('edit-btn') as HTMLElement;

    if (editBtn && user && user.id === this.score.user_id) {
      editBtn.style.display = 'inline-flex';
    } else if (editBtn) {
      editBtn.style.display = 'none';
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
        const { ABCParser } = await import('../parser/ABCParser');
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
        container.setAttribute('single-column', 'true');
        // Pass width for proper centering (height is calculated intrinsically)
        container.setAttribute('width', String(container.clientWidth));
      } else {
        // Desktop: multi-column mode with explicit dimensions (VexFlow pattern)
        container.setAttribute('single-column', 'false');
        container.setAttribute('width', String(container.clientWidth));
        container.setAttribute('height', String(container.clientHeight));
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
  }

  private async handleFork() {
    if (!this.score) return;

    const { user } = await getCurrentUser();
    if (!user) {
      alert('Please sign in to fork this score');
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
        alert(`Error forking score: ${result.error.message}`);
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
      alert('Failed to fork score');
      if (forkBtn && originalContent) {
        forkBtn.disabled = false;
        forkBtn.innerHTML = originalContent;
      }
    }
  }
}
