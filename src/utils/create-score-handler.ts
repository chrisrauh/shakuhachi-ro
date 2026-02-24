import { createScore } from '../api/scores';
import { getCurrentUser } from '../api/auth';
import { generateUniqueRandomSlug } from './slug';

export interface CreateEmptyScoreResult {
  slug: string;
  error: Error | null;
}

/**
 * Create an empty score with a random slug
 * @returns The slug of the created score and any error
 * @example
 * const { slug, error } = await createEmptyScore();
 * if (error) { console.error(error); }
 * else { window.location.href = `/score/${slug}/edit`; }
 */
export async function createEmptyScore(): Promise<CreateEmptyScoreResult> {
  // Check authentication
  const { user } = await getCurrentUser();
  if (!user) {
    return {
      slug: '',
      error: new Error('Please log in to create scores'),
    };
  }

  // Generate unique random slug
  const { slug, error: slugError } = await generateUniqueRandomSlug();
  if (slugError) {
    return { slug: '', error: slugError };
  }

  // Create empty score with random slug as title
  const result = await createScore({
    title: slug, // Use slug as initial title (user can change)
    data_format: 'json',
    data: { title: '', style: 'kinko', notes: [] },
  });

  if (result.error) {
    return { slug: '', error: result.error };
  }

  return { slug: result.score!.slug, error: null };
}
