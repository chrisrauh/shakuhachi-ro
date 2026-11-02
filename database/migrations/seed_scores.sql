-- Seed: Add 6 shakuhachi songs to the library
-- Run this AFTER running add_attribution_to_scores.sql and add_licensing_to_scores.sql
--
-- This script automatically uses the first user in auth.users as the owner

-- Set the user ID automatically from the first user
DO $$
DECLARE
  owner_id UUID;
BEGIN

-- Get the first user ID automatically
SELECT id INTO owner_id FROM auth.users LIMIT 1;

IF owner_id IS NULL THEN
  RAISE EXCEPTION 'No users found in auth.users. Please create an account first.';
END IF;

RAISE NOTICE 'Using user ID: %', owner_id;

-- 1. Akatombo (Red Dragonfly)
-- Provenance not yet established (#306), so neither layer is asserted.
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, license)
VALUES (
  owner_id,
  'Akatombo',
  'akatombo',
  'Traditional',
  'A beloved Japanese folk song about red dragonflies (赤とんぼ). This piece is perfect for beginners learning shakuhachi notation and features a simple, memorable melody.',
  'json',
  '{"title":"Akatombo","style":"kinko","notes":[{"sign":"ro","register":0,"duration":"1/2"},{"sign":"re","register":0,"duration":"1/2"},{"sign":"re","register":0,"duration":"3/2"},{"sign":"chi","register":0,"duration":"1/2"},{"sign":"ri","register":0,"accidental":"chu-meri","duration":"1/2"},{"sign":"ro","register":1,"duration":"1/2"},{"sign":"re","register":1,"duration":"1/2"},{"sign":"tsu","register":1,"accidental":"chu-meri","duration":"1/2"},{"sign":"ro","register":1,"duration":"1"},{"sign":"tsu","register":1,"accidental":"chu-meri","duration":"1/2"},{"sign":"re","register":0,"duration":"1/2"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"accidental":"chu-meri","duration":"2"},{"rest":true,"duration":"1"},{"sign":"ri","register":0,"accidental":"chu-meri","duration":"1/2"},{"sign":"tsu","register":1,"accidental":"chu-meri","duration":"1/2"},{"sign":"ro","register":1,"duration":"3/2"},{"sign":"tsu","register":1,"accidental":"chu-meri","duration":"1/2"},{"sign":"re","register":1,"duration":"1/2"},{"sign":"tsu","register":1,"accidental":"chu-meri","duration":"1/2"},{"sign":"ro","register":1,"duration":"1/2"},{"sign":"tsu","register":1,"accidental":"chu-meri","duration":"1/2"},{"sign":"ro","register":1,"duration":"1/2"},{"sign":"ri","register":0,"accidental":"chu-meri","duration":"1/2"},{"sign":"ro","register":1,"duration":"1/2"},{"sign":"ri","register":0,"accidental":"chu-meri","duration":"1/2"},{"sign":"re","register":0,"duration":"1/2"},{"sign":"ri","register":0,"accidental":"chu-meri","duration":"1/2"},{"sign":"chi","register":0,"duration":"1/2"},{"sign":"re","register":0,"duration":"1/2"},{"sign":"re","register":0,"duration":"2"},{"rest":true,"duration":"1"}],"composer":"Traditional"}',
  'NOASSERTION'
);

-- 2. Sakura Sakura
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, source_url, source_description, composition_copyright_status, composition_copyright_basis, license)
VALUES (
  owner_id,
  'Sakura Sakura',
  'sakura-sakura',
  'Traditional',
  'A beloved Japanese folk song celebrating cherry blossoms in springtime. One of the most recognized melodies in Japanese music.',
  'json',
  '{"title":"Sakura Sakura","style":"kinko","composer":"Traditional","notes":[{"sign":"chi","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"ro","register":1,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"ro","register":1,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"3"},{"sign":"chi","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"2"}]}'::jsonb,
  'https://www.komuso.com/pieces/pieces.pl?piece=2106',
  'Traditional Japanese folk song from the Edo period, widely known as a symbol of Japan.',
  'public_domain',
  'traditional_immemorial',
  'CC-BY-SA-4.0'
);

-- 3. Kojo no Tsuki
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, source_url, source_description, composition_copyright_status, composition_copyright_basis, composition_year_author_died, license)
VALUES (
  owner_id,
  'Kojo no Tsuki',
  'kojo-no-tsuki',
  'Rentaro Taki (1901)',
  'Moon Over the Ruined Castle - A melancholic melody depicting moonlight over an abandoned castle. One of the earliest Western-influenced Japanese compositions.',
  'json',
  '{"title":"Kojo no Tsuki","style":"kinko","composer":"Rentaro Taki (1901)","notes":[{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"ro","register":1,"duration":"2"},{"sign":"ri","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"4"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"ro","register":1,"duration":"2"},{"sign":"ri","register":0,"duration":"2"},{"sign":"ro","register":1,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"4"},{"sign":"ri","register":0,"duration":"1"},{"sign":"ro","register":1,"duration":"1"},{"sign":"ro","register":1,"duration":"1"},{"sign":"tsu","register":1,"duration":"1"},{"sign":"ro","register":1,"duration":"2"},{"sign":"ri","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"4"},{"sign":"ri","register":0,"duration":"1"},{"sign":"ro","register":1,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"4"}]}'::jsonb,
  'https://imslp.org/wiki/K%C5%8Dj%C5%8D_no_Tsuki_(Taki,_Rentar%C5%8D)',
  'Composed in 1901 by Rentaro Taki. Copyright expired; composer died 1903.',
  'public_domain',
  'author_died',
  1903,
  'CC-BY-SA-4.0'
);

-- 4. Kuroda Bushi
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, source_url, source_description, composition_copyright_status, composition_copyright_basis, license)
VALUES (
  owner_id,
  'Kuroda Bushi',
  'kuroda-bushi',
  'Traditional (Chikuzen)',
  'A dignified folk song from Fukuoka celebrating the Kuroda samurai clan. Popular at drinking parties since the Edo period.',
  'json',
  '{"title":"Kuroda Bushi","style":"kinko","composer":"Traditional (Chikuzen)","notes":[{"sign":"ro","register":0,"duration":"2"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"2"},{"sign":"ri","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"2"},{"sign":"ro","register":0,"duration":"2"},{"sign":"ro","register":0,"duration":"2"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"2"},{"sign":"ri","register":0,"duration":"2"},{"sign":"ro","register":1,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"4"},{"sign":"ri","register":0,"duration":"1"},{"sign":"ro","register":1,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"ro","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"4"},{"sign":"re","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"ri","register":0,"duration":"1"},{"sign":"chi","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"2"},{"sign":"tsu","register":0,"duration":"2"},{"sign":"ro","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"ro","register":0,"duration":"4"}]}'::jsonb,
  'https://www.komuso.com/pieces/pieces.pl?piece=2392',
  'Traditional min''yo folk song originating from Chikuzen Imayo in the Edo period.',
  'public_domain',
  'traditional_immemorial',
  'CC-BY-SA-4.0'
);

-- 5. Shika no Tone
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, source_url, source_description, composition_copyright_status, composition_copyright_basis, license)
VALUES (
  owner_id,
  'Shika no Tone',
  'shika-no-tone',
  'Traditional (Kinko-ryu)',
  'The Distant Cry of Deer - A contemplative honkyoku piece depicting deer calling in autumn mountains. Traditionally played as a duet.',
  'json',
  '{"title":"Shika no Tone","style":"kinko","composer":"Traditional (Kinko-ryu)","notes":[{"sign":"ro","register":0,"duration":"4"},{"rest":true,"duration":"1"},{"sign":"ro","register":0,"duration":"2"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"ro","register":0,"duration":"2"},{"sign":"ro","register":0,"chu_meri":true,"duration":"2"},{"sign":"ro","register":0,"duration":"2"},{"rest":true,"duration":"1"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"re","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"3"},{"sign":"re","register":0,"duration":"2"},{"sign":"tsu","register":0,"duration":"1"},{"sign":"ro","register":0,"duration":"3"},{"rest":true,"duration":"2"},{"sign":"chi","register":0,"duration":"2"},{"sign":"ri","register":0,"duration":"3"},{"sign":"ro","register":1,"duration":"2"},{"sign":"ri","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"2"},{"sign":"tsu","register":0,"duration":"2"},{"sign":"ro","register":0,"duration":"4"},{"rest":true,"duration":"2"},{"sign":"ri","register":0,"duration":"3"},{"sign":"ro","register":1,"duration":"4"},{"sign":"tsu","register":1,"duration":"2"},{"sign":"ro","register":1,"duration":"3"},{"sign":"ri","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"3"},{"sign":"re","register":0,"duration":"2"},{"sign":"tsu","register":0,"duration":"2"},{"sign":"ro","register":0,"duration":"6"}]}'::jsonb,
  'https://www.komuso.com/pieces/pieces.pl?piece=2647',
  'Traditional Kinko-ryu honkyoku transmitted by Ikkei-Shi. Simplified opening section.',
  'public_domain',
  'traditional_immemorial',
  'CC-BY-SA-4.0'
);

-- 6. Tsuru no Sugomori
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, source_url, source_description, composition_copyright_status, composition_copyright_basis, license)
VALUES (
  owner_id,
  'Tsuru no Sugomori',
  'tsuru-no-sugomori',
  'Traditional (Dokyoku)',
  'Nesting of Cranes - A famous honkyoku depicting the life cycle of cranes. Selected for NASA''s Voyager Golden Record in 1977.',
  'json',
  '{"title":"Tsuru no Sugomori","style":"kinko","composer":"Traditional (Dokyoku)","notes":[{"sign":"ro","register":0,"duration":"4"},{"sign":"tsu","register":0,"duration":"2"},{"sign":"ro","register":0,"duration":"2"},{"rest":true,"duration":"1"},{"sign":"re","register":0,"duration":"3"},{"sign":"chi","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"2"},{"sign":"tsu","register":0,"duration":"3"},{"sign":"ro","register":0,"duration":"4"},{"rest":true,"duration":"2"},{"sign":"chi","register":0,"duration":"2"},{"sign":"ri","register":0,"duration":"3"},{"sign":"ro","register":1,"duration":"4"},{"sign":"tsu","register":1,"duration":"2"},{"sign":"ro","register":1,"duration":"3"},{"sign":"ri","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"2"},{"sign":"ri","register":0,"duration":"2"},{"sign":"chi","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"3"},{"sign":"tsu","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"2"},{"sign":"tsu","register":0,"duration":"2"},{"sign":"ro","register":0,"duration":"4"},{"rest":true,"duration":"2"},{"sign":"ri","register":0,"duration":"3"},{"sign":"ro","register":1,"duration":"2"},{"sign":"re","register":1,"duration":"2"},{"sign":"ro","register":1,"duration":"4"},{"sign":"tsu","register":1,"duration":"1"},{"sign":"ro","register":1,"duration":"1"},{"sign":"tsu","register":1,"duration":"1"},{"sign":"ro","register":1,"duration":"1"},{"sign":"ri","register":0,"duration":"4"},{"sign":"chi","register":0,"duration":"2"},{"sign":"re","register":0,"duration":"2"},{"sign":"tsu","register":0,"duration":"3"},{"sign":"ro","register":0,"duration":"6"}]}'::jsonb,
  'https://www.komuso.com/pieces/pieces.pl?piece=2218',
  'Traditional Dokyoku honkyoku. Opening section of this celebrated piece.',
  'public_domain',
  'traditional_immemorial',
  'CC-BY-SA-4.0'
);

RAISE NOTICE 'Successfully seeded 6 songs!';

END $$;
