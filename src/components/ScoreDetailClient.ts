import { MusicXMLParser } from '../web-component/parser/MusicXMLParser';
import { forkScore, deleteScore } from '../api/scores';
import { onAuthReady, getCurrentUser } from '../api/auth';
import { ConfirmDialog } from './ConfirmDialog';
import { toast } from './Toast';
import { ButtonLoadingState } from './LoadingSpinner';
import type { Score } from '../api/scores';
import type { User } from '@supabase/supabase-js';
import type { ScoreData as RendererScoreData } from '../web-component/types/ScoreData';
import { STRINGS } from '../constants/strings';

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
        // this.score remains null, renderScore() will display error UI
      }
    } else {
      console.error('Score data element not found in page');
      // this.score remains null, renderScore() will display error UI
    }
  }

  async init() {
    // Subscribe to auth state changes using onAuthReady
    // Handles Supabase's quirky event ordering automatically
    onAuthReady((user) => {
      const userChanged = this.currentUser?.id !== user?.id;
      this.currentUser = user;
      if (userChanged) {
        this.handleEditButtonVisibility(user);
      }
    });

    // Render score visualization (handles error state if score is null)
    await this.renderScore();

    // Only attach listeners if we have a valid score
    if (this.score) {
      // Attach event listeners
      this.attachEventListeners();
    }
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
    if (!container) return;

    // Handle missing score data
    if (!this.score) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--color-text-danger);">
          <h2 style="margin-bottom: 16px;">Score data not found</h2>
          <p>The score data is empty.</p>
          <p style="margin-top: 24px;">
            <a href="/" style="color: var(--color-primary); text-decoration: underline;">Return to library</a>
          </p>
        </div>
      `;
      return;
    }

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

      // Set CSS variables for theme colors BEFORE setting attributes
      // (setting data-score attribute triggers render, so CSS vars must be ready)
      container.style.setProperty(
        '--shakuhachi-note-color',
        'var(--color-text-primary)',
      );
      container.style.setProperty(
        '--shakuhachi-note-vertical-spacing',
        isMobile ? '40px' : '44px',
      );

      if (isMobile) {
        // Mobile: single-column mode with intrinsic sizing
        container.setAttribute('columns', '1');
        // Don't set width - let component use intrinsic width (140px)
        // Parent container centers it with flexbox align-items: center
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

    const dialog = STRINGS.DIALOGS.ScoreDetailClient.deleteScore;
    new ConfirmDialog().show({
      title: dialog.title,
      message: dialog.message(this.score.title),
      confirmText: dialog.confirmText,
      cancelText: dialog.cancelText,
      onConfirm: () => this.performDelete(),
    });
  }

  private async performDelete() {
    if (!this.score) return;

    const deleteBtn = document.getElementById(
      'delete-btn',
    ) as HTMLButtonElement;
    const loadingState = deleteBtn ? new ButtonLoadingState(deleteBtn) : null;
    loadingState?.show('<span>Deleting…</span>');

    const result = await deleteScore(this.score.id);
    if (result.error) {
      toast.error(
        STRINGS.ERRORS.ScoreDetailClient.deleteError(result.error.message),
      );
      loadingState?.hide();
      return;
    }

    sessionStorage.setItem('score-deleted', this.score.title);
    window.location.href = '/';
  }

  private async handleFork() {
    if (!this.score) return;

    const { user } = await getCurrentUser();
    if (!user) {
      toast.error(STRINGS.ERRORS.ScoreDetailClient.forkLoginRequired);
      return;
    }

    // Show confirmation dialog
    const dialog = STRINGS.DIALOGS.ScoreDetailClient.forkScore;
    new ConfirmDialog().show({
      title: dialog.title,
      message: dialog.message(this.score.title),
      confirmText: dialog.confirmText,
      cancelText: dialog.cancelText,
      onConfirm: () => this.performFork(),
    });
  }

  private async performFork() {
    if (!this.score) return;

    const forkBtn = document.getElementById('fork-btn') as HTMLButtonElement;
    const loadingState = forkBtn ? new ButtonLoadingState(forkBtn) : null;
    loadingState?.show('<span class="count">⋯</span>');

    try {
      const result = await forkScore(this.score.id);
      if (result.error) {
        toast.error(
          STRINGS.ERRORS.ScoreDetailClient.forkError(result.error.message),
        );
        loadingState?.hide();
        return;
      }

      if (result.score) {
        // Redirect to editor with the forked score
        window.location.href = `/editor.html?id=${result.score.id}`;
      }
    } catch {
      toast.error(STRINGS.ERRORS.ScoreDetailClient.forkFailed);
      loadingState?.hide();
    }
  }
}
