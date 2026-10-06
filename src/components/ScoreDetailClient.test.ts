import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreDetailClient } from './ScoreDetailClient';
import { deleteScore } from '../api/scores';
import { purgeScoreCache } from '../api/purge';
import { toScoreData } from '../utils/score-data';
import type { Score } from '../api/scores';

// vi.mock must be at top level for Vitest hoisting to work
vi.mock('../api/scores');
vi.mock('../api/purge');
vi.mock('../api/auth', () => ({
  onAuthReady: vi.fn(),
  getCurrentUser: vi.fn(),
}));
vi.mock('../utils/init-header', () => ({
  // Confirm immediately, as if the user clicked the dialog's confirm button.
  confirmDialog: { show: vi.fn(({ onConfirm }) => onConfirm()) },
}));
vi.mock('./Toast', () => ({ toast: { error: vi.fn() } }));
vi.mock('../utils/score-data');

const calls: string[] = [];

function mountScorePage(score: Partial<Score>) {
  document.body.innerHTML = `
    <script id="score-data" type="application/json">${JSON.stringify({ score })}</script>
    <button id="delete-btn"></button>
  `;
}

async function deleteViaButton() {
  const client = new ScoreDetailClient();
  await client.init();
  document.getElementById('delete-btn')!.click();
  await vi.waitFor(() => expect(sessionStorage.getItem('score-deleted')));
}

describe('ScoreDetailClient delete', () => {
  beforeEach(() => {
    calls.length = 0;
    sessionStorage.clear();
    vi.mocked(deleteScore).mockImplementation(async () => {
      calls.push('delete');
      return { error: null };
    });
    vi.mocked(purgeScoreCache).mockImplementation(async (slug) => {
      calls.push(`purge ${slug}`);
    });
  });

  it('purges the parent page before deleting a fork, and the fork after', async () => {
    mountScorePage({
      id: '2',
      title: 'My fork',
      slug: 'my-fork',
      parent: {
        slug: 'akatombo',
        title: 'Akatombo',
        license: 'CC-BY-SA-4.0',
        user_id: 'someone-else',
      },
    });

    await deleteViaButton();

    // After the delete the caller no longer owns a fork of the parent, so the
    // purge endpoint would refuse the parent purge.
    expect(calls).toEqual(['purge akatombo', 'delete', 'purge my-fork']);
  });

  it('purges only its own page when the score is not a fork', async () => {
    mountScorePage({
      id: '1',
      title: 'Akatombo',
      slug: 'akatombo',
      parent: null,
    });

    await deleteViaButton();

    expect(calls).toEqual(['delete', 'purge akatombo']);
  });
});

describe('ScoreDetailClient render error', () => {
  it('shows a parse error as text, not markup', async () => {
    mountScorePage({ data_format: 'abc', data: 'not abc' });
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="score-renderer"></div>',
    );
    vi.mocked(toScoreData).mockImplementation(() => {
      throw new Error('<img src=x onerror="alert(1)">');
    });

    await new ScoreDetailClient().init();

    const error = document.querySelector('.page-error')!;
    expect(error.querySelector('img')).toBeNull();
    expect(error.textContent).toContain('<img src=x onerror="alert(1)">');
  });
});
