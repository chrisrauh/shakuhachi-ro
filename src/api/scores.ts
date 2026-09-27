import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import {
  generateSlug,
  ensureUniqueSlug,
  generateUniqueRandomSlug,
} from '../utils/slug';
import type { ScoreData } from '../web-component/types/ScoreData';
import type {
  CopyrightBasis,
  CopyrightStatus,
  ScoreLicense,
} from '../utils/license';

export type ScoreDataFormat = 'musicxml' | 'json' | 'abc';

/**
 * Stored score content: a ScoreData object when data_format is 'json',
 * the text as typed when it is 'musicxml' or 'abc'. Keyed on data_format so
 * checking the format narrows the data, and a mismatched pair doesn't compile.
 */
export type ScoreContent =
  | { data_format: 'json'; data: ScoreData }
  | { data_format: 'musicxml' | 'abc'; data: string };

/**
 * The parent of a fork, embedded in the same query as the score itself.
 * Only the fields the "forked from" link and the editor's licence rules need —
 * not a full Score.
 */
export interface ScoreParent {
  slug: string;
  title: string;
  license: ScoreLicense;
  user_id: string;
}

export type Score = ScoreContent & {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  composer: string | null;
  description: string | null;
  forked_from: string | null;
  parent: ScoreParent | null;
  fork_count: number;
  source_url: string | null;
  source_description: string | null;
  composition_copyright_status: CopyrightStatus;
  composition_copyright_basis: CopyrightBasis | null;
  /** NULL means shakuhachi.ro determined the status itself. */
  composition_copyright_source: string | null;
  composition_year_author_died: number | null;
  composition_year_published: number | null;
  license: ScoreLicense;
  created_at: string;
  updated_at: string;
};

export type CreateScoreData = ScoreContent & {
  title: string;
  composer?: string;
  description?: string;
  forked_from?: string;
  source_url?: string;
  source_description?: string;
  composition_copyright_status?: CopyrightStatus;
  composition_copyright_basis?: CopyrightBasis | null;
  composition_copyright_source?: string | null;
  composition_year_author_died?: number | null;
  composition_year_published?: number | null;
  /** Omit for the database default, CC BY-NC-SA 4.0. */
  license?: ScoreLicense;
};

/** The content is updated as a pair or not at all. */
export type UpdateScoreData = (
  | ScoreContent
  | { data_format?: never; data?: never }
) & {
  title?: string;
  composer?: string;
  description?: string;
  source_url?: string;
  source_description?: string;
  license?: ScoreLicense;
  // slug is intentionally omitted — slugs are immutable after creation to preserve
  // stable URLs (bookmarks, shared links). See TODO for future slug editing feature.
};

export interface ScoreResult {
  score: Score | null;
  error: Error | null;
}

export interface ScoresResult {
  scores: Score[];
  error: Error | null;
}

/**
 * fork_count is derived, not stored. PostgREST counts the `forked_from`
 * self-relation, so the number can never drift from reality the way a
 * denormalized column did (missed increments, deletes that never decremented).
 *
 * The embed is aliased `forks` rather than `fork_count` so `toScore` can map it
 * onto the field callers already read.
 *
 * `parent` embeds the fork's source in the same round trip. The score page used
 * to fetch it with a second, sequential query, which costs a full transatlantic
 * round trip in production (functions run in us-east, the database is in Paris).
 *
 * The two embeds point in opposite directions across the same self-relation:
 * `scores!forked_from` resolves to the children (hence the count), and bare
 * `forked_from(...)` to the parent. PostgREST rejects the constraint-name hint
 * form here, so the column-name form is the one that works.
 */
const SCORE_SELECT =
  '*, forks:scores!forked_from(count), parent:forked_from(slug,title,license,user_id)';

function toScore(row: Record<string, any>): Score {
  const { forks, ...rest } = row;
  return { ...rest, fork_count: forks?.[0]?.count ?? 0 } as Score;
}

// Anything can be thrown; callers of this module always get an Error back.
function toError(thrown: unknown, action: string): Error {
  return thrown instanceof Error
    ? thrown
    : new Error(`Unknown error ${action}`);
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
    let baseSlug = generateSlug(scoreData.title);

    // Fallback to random slug if title is all punctuation/symbols
    if (!baseSlug) {
      const { slug: randomSlug, error: randomError } =
        await generateUniqueRandomSlug();
      if (randomError) {
        return { score: null, error: randomError };
      }
      baseSlug = randomSlug;
    }

    // Get existing slugs to ensure uniqueness
    const { data: existingScores, error: slugQueryError } = await supabase
      .from('scores')
      .select('slug')
      .ilike('slug', `${baseSlug}%`);

    if (slugQueryError) {
      return {
        score: null,
        error: new Error(
          `Failed to check slug uniqueness: ${slugQueryError.message}`,
        ),
      };
    }

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
        source_url: scoreData.source_url || null,
        source_description: scoreData.source_description || null,
        // Undefined fields are left out of the request, so the database
        // defaults apply: not_evaluated, and CC BY-NC-SA 4.0.
        composition_copyright_status: scoreData.composition_copyright_status,
        composition_copyright_basis: scoreData.composition_copyright_basis,
        composition_copyright_source: scoreData.composition_copyright_source,
        composition_year_author_died: scoreData.composition_year_author_died,
        composition_year_published: scoreData.composition_year_published,
        license: scoreData.license,
      })
      .select(SCORE_SELECT)
      .single();

    if (error) {
      return {
        score: null,
        error: new Error(`Failed to create score: ${error.message}`),
      };
    }

    return { score: toScore(data), error: null };
  } catch (error) {
    return {
      score: null,
      error: toError(error, 'creating score'),
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
      .select(SCORE_SELECT)
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

    return { score: toScore(data), error: null };
  } catch (error) {
    return {
      score: null,
      error: toError(error, 'updating score'),
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
      error: toError(error, 'deleting score'),
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
      .select(SCORE_SELECT)
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

    return { score: toScore(data), error: null };
  } catch (error) {
    return {
      score: null,
      error: toError(error, 'fetching score'),
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
      .select(SCORE_SELECT)
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

    return { score: toScore(data), error: null };
  } catch (error) {
    return {
      score: null,
      error: toError(error, 'fetching score'),
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
      .select(SCORE_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        scores: [],
        error: new Error(`Failed to fetch user scores: ${error.message}`),
      };
    }

    return { scores: (data || []).map(toScore), error: null };
  } catch (error) {
    return {
      scores: [],
      error: toError(error, 'fetching user scores'),
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
      .select(SCORE_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        scores: [],
        error: new Error(`Failed to fetch scores: ${error.message}`),
      };
    }

    return { scores: (data || []).map(toScore), error: null };
  } catch (error) {
    return {
      scores: [],
      error: toError(error, 'fetching scores'),
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
      .select(SCORE_SELECT)
      .or(`title.ilike.${searchTerm},composer.ilike.${searchTerm}`)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        scores: [],
        error: new Error(`Failed to search scores: ${error.message}`),
      };
    }

    return { scores: (data || []).map(toScore), error: null };
  } catch (error) {
    return {
      scores: [],
      error: toError(error, 'searching scores'),
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

    // Create the forked score (keep original title, no "(Fork)" suffix).
    // Attribution and both rights layers travel with the notation: the
    // composition's status is a fact that forking does not change, and the fork
    // starts under its source's licence. The database enforces the licence rules
    // and rejects a fork the source's licence does not allow, with the reason.
    const forkResult = await createScore({
      title: originalScore.title,
      composer: originalScore.composer || undefined,
      description: originalScore.description || undefined,
      ...(originalScore.data_format === 'json'
        ? { data_format: 'json', data: originalScore.data }
        : { data_format: originalScore.data_format, data: originalScore.data }),
      forked_from: scoreId,
      source_url: originalScore.source_url || undefined,
      source_description: originalScore.source_description || undefined,
      composition_copyright_status: originalScore.composition_copyright_status,
      composition_copyright_basis: originalScore.composition_copyright_basis,
      composition_copyright_source: originalScore.composition_copyright_source,
      composition_year_author_died: originalScore.composition_year_author_died,
      composition_year_published: originalScore.composition_year_published,
      license: originalScore.license,
    });

    // No counter to bump: the `forked_from` column set above IS the fork count.
    // See SCORE_SELECT.
    return forkResult;
  } catch (error) {
    return {
      score: null,
      error: toError(error, 'forking score'),
    };
  }
}
