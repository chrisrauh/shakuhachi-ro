-- Seed: Add 7 shakuhachi songs to the library
-- Run this AFTER running add_attribution_to_scores.sql
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
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data)
VALUES (
  owner_id,
  'Akatombo',
  'akatombo',
  'Traditional',
  'A beloved Japanese folk song about red dragonflies (赤とんぼ). This piece is perfect for beginners learning shakuhachi notation and features a simple, memorable melody.',
  'musicxml',
  '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd"><score-partwise version="4.0"><work><work-title>Akatombo</work-title></work><identification><creator type="composer">Traditional</creator></identification><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>3</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>3</duration><type>quarter</type><dot/></note><note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note></measure><measure number="2"><note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>G</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>D</step><octave>5</octave></pitch><duration>2</duration><type>quarter</type></note></measure><measure number="3"><note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note><note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><type>quarter</type></note></measure><measure number="4"><note><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><type>half</type></note><note><rest/><duration>2</duration><type>quarter</type></note></measure><measure number="5"><note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>D</step><octave>5</octave></pitch><duration>3</duration><type>quarter</type><dot/></note><note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note></measure><measure number="6"><note><pitch><step>G</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note></measure><measure number="7"><note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note></measure><measure number="8"><note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>half</type></note><note><rest/><duration>2</duration><type>quarter</type></note></measure></part></score-partwise>'
);

-- 2. Love Story
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data)
VALUES (
  owner_id,
  'Love Story',
  'love-story',
  'Unknown',
  'Transcribed from handwritten shakuhachi notation. Features octave marks, meri modifiers, and accidentals for expressive performance.',
  'json',
  '{"title":"Love Story","style":"kinko","composer":"Unknown","notes":[{"pitch":{"step":"tsu","octave":1},"duration":1},{"pitch":{"step":"chi","octave":1},"duration":1},{"pitch":{"step":"tsu","octave":1},"duration":1},{"pitch":{"step":"tsu","octave":1},"duration":1},{"pitch":{"step":"tsu","octave":0},"duration":2},{"rest":true,"duration":1},{"pitch":{"step":"chi","octave":1},"duration":2},{"pitch":{"step":"tsu","octave":1},"duration":1},{"pitch":{"step":"tsu","octave":1},"duration":1},{"pitch":{"step":"chi","octave":1},"duration":1},{"pitch":{"step":"chi","octave":1},"chu_meri":true,"duration":2},{"pitch":{"step":"tsu","octave":1},"duration":1},{"pitch":{"step":"tsu","octave":0},"duration":1},{"pitch":{"step":"tsu","octave":0},"duration":2},{"rest":true,"duration":2},{"pitch":{"step":"tsu","octave":1},"duration":1},{"pitch":{"step":"tsu","octave":0},"duration":1},{"pitch":{"step":"chi","octave":0},"duration":1},{"pitch":{"step":"tsu","octave":0},"duration":1},{"pitch":{"step":"chi","octave":1},"chu_meri":true,"duration":2},{"rest":true,"duration":2},{"pitch":{"step":"tsu","octave":1},"duration":1},{"pitch":{"step":"tsu","octave":0},"duration":1},{"pitch":{"step":"ri","octave":0},"duration":1},{"pitch":{"step":"ri","octave":0},"duration":2},{"rest":true,"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":1},{"pitch":{"step":"ri","octave":0},"duration":1},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":1},{"pitch":{"step":"tsu","octave":1},"duration":1},{"pitch":{"step":"tsu","octave":1},"duration":1},{"pitch":{"step":"tsu","octave":0},"duration":1},{"pitch":{"step":"ri","octave":1},"duration":1},{"pitch":{"step":"ri","octave":0},"duration":1},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":1},{"pitch":{"step":"ri","octave":0},"duration":1},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"rest":true,"duration":1},{"pitch":{"step":"ri","octave":0},"duration":1},{"pitch":{"step":"ri","octave":0},"duration":1},{"rest":true,"duration":1},{"pitch":{"step":"tsu","octave":0},"duration":1},{"pitch":{"step":"tsu","octave":0},"duration":1}]}'::jsonb
);

-- 3. Sakura Sakura
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, source_url, rights, source_description)
VALUES (
  owner_id,
  'Sakura Sakura',
  'sakura-sakura',
  'Traditional',
  'A beloved Japanese folk song celebrating cherry blossoms in springtime. One of the most recognized melodies in Japanese music.',
  'json',
  '{"title":"Sakura Sakura","style":"kinko","composer":"Traditional","notes":[{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":6},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":4}]}'::jsonb,
  'https://www.komuso.com/pieces/pieces.pl?piece=2106',
  'Public Domain',
  'Traditional Japanese folk song from the Edo period, widely known as a symbol of Japan.'
);

-- 4. Kojo no Tsuki
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, source_url, rights, source_description)
VALUES (
  owner_id,
  'Kojo no Tsuki',
  'kojo-no-tsuki',
  'Rentaro Taki (1901)',
  'Moon Over the Ruined Castle - A melancholic melody depicting moonlight over an abandoned castle. One of the earliest Western-influenced Japanese compositions.',
  'json',
  '{"title":"Kojo no Tsuki","style":"kinko","composer":"Rentaro Taki (1901)","notes":[{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":4},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":8},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":4},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"ro","octave":1},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":8},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":2},{"pitch":{"step":"tsu","octave":1},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":4},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":8},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":8}]}'::jsonb,
  'https://imslp.org/wiki/K%C5%8Dj%C5%8D_no_Tsuki_(Taki,_Rentar%C5%8D)',
  'Public Domain',
  'Composed in 1901 by Rentaro Taki. Copyright expired; composer died 1903.'
);

-- 5. Kuroda Bushi
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, source_url, rights, source_description)
VALUES (
  owner_id,
  'Kuroda Bushi',
  'kuroda-bushi',
  'Traditional (Chikuzen)',
  'A dignified folk song from Fukuoka celebrating the Kuroda samurai clan. Popular at drinking parties since the Edo period.',
  'json',
  '{"title":"Kuroda Bushi","style":"kinko","composer":"Traditional (Chikuzen)","notes":[{"pitch":{"step":"ro","octave":0},"duration":4},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":4},{"pitch":{"step":"ro","octave":0},"duration":4},{"pitch":{"step":"ro","octave":0},"duration":4},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"ro","octave":1},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":8},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"ro","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":8},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":2},{"pitch":{"step":"chi","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"tsu","octave":0},"duration":4},{"pitch":{"step":"ro","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"ro","octave":0},"duration":8}]}'::jsonb,
  'https://www.komuso.com/pieces/pieces.pl?piece=2392',
  'Public Domain',
  'Traditional min''yo folk song originating from Chikuzen Imayo in the Edo period.'
);

-- 6. Shika no Tone
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, source_url, rights, source_description)
VALUES (
  owner_id,
  'Shika no Tone',
  'shika-no-tone',
  'Traditional (Kinko-ryu)',
  'The Distant Cry of Deer - A contemplative honkyoku piece depicting deer calling in autumn mountains. Traditionally played as a duet.',
  'json',
  '{"title":"Shika no Tone","style":"kinko","composer":"Traditional (Kinko-ryu)","notes":[{"pitch":{"step":"ro","octave":0},"duration":8},{"rest":true,"duration":2},{"pitch":{"step":"ro","octave":0},"duration":4},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"ro","octave":0},"duration":4},{"pitch":{"step":"ro","octave":0},"chu_meri":true,"duration":4},{"pitch":{"step":"ro","octave":0},"duration":4},{"rest":true,"duration":2},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":6},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"tsu","octave":0},"duration":2},{"pitch":{"step":"ro","octave":0},"duration":6},{"rest":true,"duration":4},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"ri","octave":0},"duration":6},{"pitch":{"step":"ro","octave":1},"duration":4},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"tsu","octave":0},"duration":4},{"pitch":{"step":"ro","octave":0},"duration":8},{"rest":true,"duration":4},{"pitch":{"step":"ri","octave":0},"duration":6},{"pitch":{"step":"ro","octave":1},"duration":8},{"pitch":{"step":"tsu","octave":1},"duration":4},{"pitch":{"step":"ro","octave":1},"duration":6},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":6},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"tsu","octave":0},"duration":4},{"pitch":{"step":"ro","octave":0},"duration":12}]}'::jsonb,
  'https://www.komuso.com/pieces/pieces.pl?piece=2647',
  'Public Domain',
  'Traditional Kinko-ryu honkyoku transmitted by Ikkei-Shi. Simplified opening section.'
);

-- 7. Tsuru no Sugomori
INSERT INTO scores (user_id, title, slug, composer, description, data_format, data, source_url, rights, source_description)
VALUES (
  owner_id,
  'Tsuru no Sugomori',
  'tsuru-no-sugomori',
  'Traditional (Dokyoku)',
  'Nesting of Cranes - A famous honkyoku depicting the life cycle of cranes. Selected for NASA''s Voyager Golden Record in 1977.',
  'json',
  '{"title":"Tsuru no Sugomori","style":"kinko","composer":"Traditional (Dokyoku)","notes":[{"pitch":{"step":"ro","octave":0},"duration":8},{"pitch":{"step":"tsu","octave":0},"duration":4},{"pitch":{"step":"ro","octave":0},"duration":4},{"rest":true,"duration":2},{"pitch":{"step":"re","octave":0},"duration":6},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"tsu","octave":0},"duration":6},{"pitch":{"step":"ro","octave":0},"duration":8},{"rest":true,"duration":4},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"ri","octave":0},"duration":6},{"pitch":{"step":"ro","octave":1},"duration":8},{"pitch":{"step":"tsu","octave":1},"duration":4},{"pitch":{"step":"ro","octave":1},"duration":6},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"ri","octave":0},"duration":4},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":6},{"pitch":{"step":"tsu","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"tsu","octave":0},"duration":4},{"pitch":{"step":"ro","octave":0},"duration":8},{"rest":true,"duration":4},{"pitch":{"step":"ri","octave":0},"duration":6},{"pitch":{"step":"ro","octave":1},"duration":4},{"pitch":{"step":"re","octave":1},"duration":4},{"pitch":{"step":"ro","octave":1},"duration":8},{"pitch":{"step":"tsu","octave":1},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":2},{"pitch":{"step":"tsu","octave":1},"duration":2},{"pitch":{"step":"ro","octave":1},"duration":2},{"pitch":{"step":"ri","octave":0},"duration":8},{"pitch":{"step":"chi","octave":0},"duration":4},{"pitch":{"step":"re","octave":0},"duration":4},{"pitch":{"step":"tsu","octave":0},"duration":6},{"pitch":{"step":"ro","octave":0},"duration":12}]}'::jsonb,
  'https://www.komuso.com/pieces/pieces.pl?piece=2218',
  'Public Domain',
  'Traditional Dokyoku honkyoku. Opening section of this celebrated piece.'
);

RAISE NOTICE 'Successfully seeded 7 songs!';

END $$;
