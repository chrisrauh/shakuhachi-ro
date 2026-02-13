import { ScoreRenderer } from '../renderer/ScoreRenderer';
import { MusicXMLParser } from '../parser/MusicXMLParser';
import { forkScore } from '../api/scores';
import { authState } from '../api/authState';
import type { Score } from '../api/scores';

interface ScoreData {
  score: Score;
  parentScore: Score | null;
}

export class ScoreDetailClient {
  private score: Score | null = null;
  private renderer?: ScoreRenderer;

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

    // Show edit button only if user is owner
    this.handleEditButtonVisibility();

    // Render score visualization
    await this.renderScore();

    // Attach event listeners
    this.attachEventListeners();

    // Listen for theme changes and re-render score
    this.setupThemeListener();
  }

  private handleEditButtonVisibility() {
    if (!this.score) return;

    const user = authState.getUser();
    const editBtn = document.getElementById('edit-btn') as HTMLElement;

    if (editBtn && user && user.id === this.score.user_id) {
      editBtn.style.display = 'flex';
    }
  }

  private async renderScore() {
    const container = document.getElementById('score-renderer-container');
    if (!container || !this.score) return;

    try {
      // Read theme-aware colors from CSS variables
      const noteColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-neutral-700')
        .trim();
      const debugLabelColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-neutral-500')
        .trim();

      this.renderer = new ScoreRenderer(container, {
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
        container.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <p>Unsupported format: ${this.score.data_format}</p>
          </div>
        `;
      }
    } catch (error) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--color-danger-600);">
          <p>Error rendering score: ${
            error instanceof Error ? error.message : 'Unknown error'
          }</p>
        </div>
      `;
    }
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

  private attachEventListeners() {
    const forkBtn = document.getElementById('fork-btn');
    if (forkBtn) {
      forkBtn.addEventListener('click', () => this.handleFork());
    }
  }

  private async handleFork() {
    if (!this.score) return;

    const user = authState.getUser();
    if (!user) {
      alert('Please sign in to fork this score');
      return;
    }

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
