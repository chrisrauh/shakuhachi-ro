import { createScore } from '../api/scores';
import { getCurrentUser } from '../api/auth';
import { generateUniqueRandomSlug } from './slug';
import type { AuthModalInterface } from '../components/AuthComponents';
import { toast } from '../components/Toast';

export interface CreateEmptyScoreResult {
  slug: string;
  error: Error | null;
}

/**
 * Create an empty score with a random slug.
 * Pure data function — no auth check, no navigation side effects.
 */
export async function createEmptyScore(): Promise<CreateEmptyScoreResult> {
  const { slug, error: slugError } = await generateUniqueRandomSlug();
  if (slugError) {
    return { slug: '', error: slugError };
  }

  const result = await createScore({
    title: slug,
    data_format: 'json',
    data: { title: '', style: 'kinko', notes: [] },
  });

  if (result.error) {
    return { slug: '', error: result.error };
  }

  return { slug: result.score!.slug, error: null };
}

/**
 * Single entry point for all "Create score" UI actions.
 * Checks auth, creates an empty score, and navigates to the editor.
 */
export async function startNewScore(
  authModal: AuthModalInterface,
): Promise<void> {
  const { user } = await getCurrentUser();
  if (!user) {
    authModal.show('login');
    return;
  }

  const { slug, error } = await createEmptyScore();
  if (error) {
    toast.error(error.message);
    return;
  }

  window.location.href = `/score/${slug}/edit`;
}
