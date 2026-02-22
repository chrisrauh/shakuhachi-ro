/**
 * Generates a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A lowercase, hyphenated slug
 * @example generateSlug("Akatombo") // "akatombo"
 * @example generateSlug("San'ya Sugagaki") // "sanya-sugagaki"
 */
export function generateSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Remove apostrophes
      .replace(/'/g, '')
      // Replace spaces and special characters with hyphens
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Collapse multiple hyphens
      .replace(/-+/g, '-')
  );
}

/**
 * Ensures a slug is unique by appending a number if needed
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 * @example ensureUniqueSlug("akatombo", ["akatombo"]) // "akatombo-2"
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

// Word lists derived from traditional shakuhachi honkyoku and folk song names
const ADJECTIVES = [
  'blue',
  'distant',
  'falling',
  'flowing',
  'gentle',
  'high',
  'late',
  'lonely',
  'midnight',
  'morning',
  'rising',
  'scattered',
  'silver',
  'spring',
  'summer',
  'winter',
  'ancient',
  'clear',
  'deep',
  'empty',
  'hidden',
  'inner',
  'light',
  'old',
  'pure',
  'quiet',
  'sacred',
  'soft',
  'still',
  'true',
  'white',
  'autumn',
  'bright',
  'eastern',
  'endless',
  'evening',
  'far',
  'first',
  'fresh',
  'floating',
  'golden',
  'natural',
  'pale',
  'peaceful',
  'ringing',
  'silent',
  'slow',
  'swift',
];

const NOUNS = [
  'crane',
  'mountain',
  'temple',
  'valley',
  'bell',
  'bird',
  'cloud',
  'deer',
  'flute',
  'garden',
  'hill',
  'moon',
  'nest',
  'ocean',
  'pine',
  'rain',
  'river',
  'sea',
  'shore',
  'sky',
  'snow',
  'spring',
  'stone',
  'stream',
  'water',
  'wave',
  'wind',
  'bamboo',
  'bridge',
  'dawn',
  'drop',
  'dusk',
  'field',
  'forest',
  'grove',
  'island',
  'lake',
  'meadow',
  'mist',
  'path',
  'peak',
  'plum',
  'pond',
  'sand',
  'shadow',
  'song',
  'sound',
  'tree',
];

/**
 * Generate a random slug using adj-[adj|noun]-noun pattern
 * Middle word can be either adjective OR noun for variety
 * @returns A random slug like "flowing-purple-crane" or "gentle-mountain-wind"
 * @example generateRandomSlug() // "distant-mountain-crane"
 * @example generateRandomSlug() // "empty-bell-temple"
 */
export function generateRandomSlug(): string {
  // First word: always adjective
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];

  // Second word: either adjective OR noun (50/50 chance)
  const useAdj = Math.random() < 0.5;
  const middle = useAdj
    ? ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    : NOUNS[Math.floor(Math.random() * NOUNS.length)];

  // Third word: always noun
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

  return `${adj}-${middle}-${noun}`;
}

/**
 * Generate a unique random slug (checks database for collisions)
 * @returns A promise resolving to a unique random slug and error (if any)
 * @example
 * const { slug, error } = await generateUniqueRandomSlug();
 * if (error) { console.error(error); }
 * else { console.log(slug); } // "flowing-peaceful-crane"
 */
export async function generateUniqueRandomSlug(): Promise<{
  slug: string;
  error: Error | null;
}> {
  const maxAttempts = 3;

  for (let i = 0; i < maxAttempts; i++) {
    const slug = generateRandomSlug();

    // Dynamic import to avoid circular dependency issues
    const { supabase } = await import('../api/supabase');

    // Check if slug exists in database
    const { data } = await supabase
      .from('scores')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (!data) {
      return { slug, error: null };
    }
  }

  return {
    slug: '',
    error: new Error('Unable to generate unique slug after 3 attempts'),
  };
}
