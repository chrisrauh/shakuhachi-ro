import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { generateSlug, ensureUniqueSlug } from '../utils/slug';

export type ScoreDataFormat = 'musicxml' | 'json';

export interface Score {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  composer: string | null;
  description: string | null;
  data_format: ScoreDataFormat;
  data: any;
  forked_from: string | null;
  fork_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateScoreData {
  title: string;
  composer?: string;
  description?: string;
  data_format: ScoreDataFormat;
  data: any;
  forked_from?: string;
}

export interface UpdateScoreData {
  title?: string;
  composer?: string;
  description?: string;
  data_format?: ScoreDataFormat;
  data?: any;
}

export interface ScoreResult {
  score: Score | null;
  error: Error | null;
}

export interface ScoresResult {
  scores: Score[];
  error: Error | null;
}

/**
 * Create a new score
 */
export async function createScore(
  scoreData: CreateScoreData,
): Promise<ScoreResult> {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return {
        score: null,
        error: new Error('User must be logged in to create scores'),
      };
    }

    // Generate slug from title
    const baseSlug = generateSlug(scoreData.title);

    // Get existing slugs to ensure uniqueness
    const { data: existingScores } = await supabase
      .from('scores')
      .select('slug')
      .ilike('slug', `${baseSlug}%`);

    const existingSlugs = existingScores?.map((s) => s.slug) || [];
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

    const { data, error } = await supabase
      .from('scores')
      .insert({
        user_id: user.id,
        title: scoreData.title,
        slug: uniqueSlug,
        composer: scoreData.composer || null,
        description: scoreData.description || null,
        data_format: scoreData.data_format,
        data: scoreData.data,
        forked_from: scoreData.forked_from || null,
      })
      .select()
      .single();

    if (error) {
      return {
        score: null,
        error: new Error(`Failed to create score: ${error.message}`),
      };
    }

    return { score: data, error: null };
  } catch (error) {
    return {
      score: null,
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error creating score'),
    };
  }
}

/**
 * Update an existing score
 */
export async function updateScore(
  id: string,
  updates: UpdateScoreData,
): Promise<ScoreResult> {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return {
        score: null,
        error: new Error('User must be logged in to update scores'),
      };
    }

    const { data, error } = await supabase
      .from('scores')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          score: null,
          error: new Error(
            'Score not found or you do not have permission to update it',
          ),
        };
      }
      return {
        score: null,
        error: new Error(`Failed to update score: ${error.message}`),
      };
    }

    return { score: data, error: null };
  } catch (error) {
    return {
      score: null,
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error updating score'),
    };
  }
}

/**
 * Delete a score
 */
export async function deleteScore(
  id: string,
): Promise<{ error: Error | null }> {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return {
        error: new Error('User must be logged in to delete scores'),
      };
    }

    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return {
        error: new Error(`Failed to delete score: ${error.message}`),
      };
    }

    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error deleting score'),
    };
  }
}

/**
 * Get a single score by ID
 */
export async function getScore(id: string): Promise<ScoreResult> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          score: null,
          error: new Error('Score not found'),
        };
      }
      return {
        score: null,
        error: new Error(`Failed to fetch score: ${error.message}`),
      };
    }

    return { score: data, error: null };
  } catch (error) {
    return {
      score: null,
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error fetching score'),
    };
  }
}

/**
 * Get a single score by slug
 */
export async function getScoreBySlug(slug: string): Promise<ScoreResult> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          score: null,
          error: new Error('Score not found'),
        };
      }
      return {
        score: null,
        error: new Error(`Failed to fetch score: ${error.message}`),
      };
    }

    return { score: data, error: null };
  } catch (error) {
    return {
      score: null,
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error fetching score'),
    };
  }
}

/**
 * Get all scores for a specific user
 */
export async function getUserScores(userId: string): Promise<ScoresResult> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        scores: [],
        error: new Error(`Failed to fetch user scores: ${error.message}`),
      };
    }

    return { scores: data || [], error: null };
  } catch (error) {
    return {
      scores: [],
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error fetching user scores'),
    };
  }
}

/**
 * Get all public scores
 */
export async function getAllScores(): Promise<ScoresResult> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        scores: [],
        error: new Error(`Failed to fetch scores: ${error.message}`),
      };
    }

    return { scores: data || [], error: null };
  } catch (error) {
    return {
      scores: [],
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error fetching scores'),
    };
  }
}

/**
 * Search scores by title or composer
 */
export async function searchScores(query: string): Promise<ScoresResult> {
  try {
    if (!query.trim()) {
      return getAllScores();
    }

    const searchTerm = `%${query}%`;

    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .or(`title.ilike.${searchTerm},composer.ilike.${searchTerm}`)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        scores: [],
        error: new Error(`Failed to search scores: ${error.message}`),
      };
    }

    return { scores: data || [], error: null };
  } catch (error) {
    return {
      scores: [],
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error searching scores'),
    };
  }
}

/**
 * Fork a score - create a copy owned by the current user
 */
export async function forkScore(scoreId: string): Promise<ScoreResult> {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return {
        score: null,
        error: new Error('User must be logged in to fork scores'),
      };
    }

    // Get the original score
    const { data: originalScore, error: fetchError } = await supabase
      .from('scores')
      .select('*')
      .eq('id', scoreId)
      .single();

    if (fetchError || !originalScore) {
      return {
        score: null,
        error: new Error('Failed to fetch score to fork'),
      };
    }

    // Create the forked score (keep original title, no "(Fork)" suffix)
    const forkResult = await createScore({
      title: originalScore.title,
      composer: originalScore.composer || undefined,
      description: originalScore.description || undefined,
      data_format: originalScore.data_format,
      data: originalScore.data,
      forked_from: scoreId,
    });

    if (forkResult.error) {
      return forkResult;
    }

    // Increment fork count on parent score
    await supabase
      .from('scores')
      .update({ fork_count: originalScore.fork_count + 1 })
      .eq('id', scoreId);

    return forkResult;
  } catch (error) {
    return {
      score: null,
      error:
        error instanceof Error
          ? error
          : new Error('Unknown error forking score'),
    };
  }
}

/**
 * Get list of curated scores for static prerendering
 * These are the official library scores that exist as static files
 */
export function getCuratedScoreSlugs(): string[] {
  return [
    'akatombo', // reference: reference/score-data/Akatombo.musicxml
    'love-story', // reference: reference/score-data/love-story.json
  ];
}
