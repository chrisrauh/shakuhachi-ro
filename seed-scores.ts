import { createScore } from './src/api/scores';
import { supabase } from './src/api/supabase';
import fs from 'fs';

/**
 * Seed script to add initial scores to the database
 *
 * Usage: node --loader ts-node/esm seed-scores.ts
 * or: npm run seed (if added to package.json)
 */

async function seedScores() {
  console.log('Starting seed script...\n');

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ Error: You must be logged in to seed scores.');
    console.error(
      'Please log in through the web app first, then run this script.',
    );
    process.exit(1);
  }

  console.log(`✓ Logged in as: ${user.email}\n`);

  // Seed Akatombo
  console.log('Adding Akatombo...');
  const akatomboXML = fs.readFileSync(
    './public/data/Akatombo.musicxml',
    'utf-8',
  );

  const akatomboResult = await createScore({
    title: 'Akatombo',
    composer: 'Traditional',
    description:
      'A beloved Japanese folk song about red dragonflies. This piece is perfect for beginners learning shakuhachi notation.',
    data_format: 'musicxml',
    data: akatomboXML,
  });

  if (akatomboResult.error) {
    console.error(`❌ Failed to add Akatombo: ${akatomboResult.error.message}`);
  } else {
    console.log(`✓ Added Akatombo (slug: ${akatomboResult.score?.slug})\n`);
  }

  console.log('Seed script complete!');
}

seedScores().catch((error) => {
  console.error('❌ Seed script failed:', error);
  process.exit(1);
});
