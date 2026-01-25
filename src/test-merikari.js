// Test the MeriKariModifier implementation
import { SVGRenderer } from './renderer/SVGRenderer';
import { MeriKariModifier } from './modifiers/MeriKariModifier';
import { OctaveDotsModifier } from './modifiers/OctaveDotsModifier';

console.log('🎼 Testing MeriKariModifier...\n');

const container = document.getElementById('merikari-test');

// Create renderer
const renderer = new SVGRenderer(container, 900, 600);

// Draw title
renderer.drawText('Meri/Kari Modifier Test', 20, 30, 20, 'Arial', '#333');

// Test 1: Basic meri/kari marks
console.log('Test 1: Basic meri/kari marks');

renderer.drawText('Basic Pitch Alterations:', 20, 80, 16, 'Arial', '#666');

const basicNotes = [
  { x: 100, y: 150, kana: 'ロ', label: 'natural (no mark)', mod: null },
  {
    x: 220,
    y: 150,
    kana: 'ロ',
    label: 'meri (-½ step)',
    mod: new MeriKariModifier('meri'),
  },
  {
    x: 360,
    y: 150,
    kana: 'ロ',
    label: 'dai-meri (-1 step)',
    mod: new MeriKariModifier('dai-meri'),
  },
  {
    x: 520,
    y: 150,
    kana: 'ロ',
    label: 'kari (+½ step)',
    mod: new MeriKariModifier('kari'),
  },
];

basicNotes.forEach((note) => {
  // Draw the note
  renderer.drawText(note.kana, note.x - 15, note.y, 40, 'Noto Sans JP', '#333');

  // Add meri/kari mark if specified
  if (note.mod) {
    note.mod.render(renderer, note.x, note.y);
  }

  // Add label below
  renderer.drawText(note.label, note.x - 45, note.y + 35, 11, 'Arial', '#666');
});

console.log('  ✓ Basic meri, dai-meri, and kari marks rendered');

// Test 2: All five notes with alterations
console.log('\nTest 2: Five fundamental notes with pitch alterations');

renderer.drawText('Five Notes with Alterations:', 20, 230, 16, 'Arial', '#666');

const fundamentalNotes = [
  { romaji: 'ro', kana: 'ロ', pitch: 'D' },
  { romaji: 'tsu', kana: 'ツ', pitch: 'F' },
  { romaji: 're', kana: 'レ', pitch: 'G' },
  { romaji: 'chi', kana: 'チ', pitch: 'A' },
  { romaji: 'ri', kana: 'リ', pitch: 'C' },
];

const startX = 80;
const startY = 280;
const noteSpacing = 120;

// Column headers
renderer.drawText(
  'natural',
  startX + noteSpacing * 0 - 20,
  startY - 20,
  11,
  'Arial',
  '#999'
);
renderer.drawText(
  'meri',
  startX + noteSpacing * 1 - 10,
  startY - 20,
  11,
  'Arial',
  '#999'
);
renderer.drawText(
  'dai-meri',
  startX + noteSpacing * 2 - 20,
  startY - 20,
  11,
  'Arial',
  '#999'
);
renderer.drawText(
  'kari',
  startX + noteSpacing * 3 - 10,
  startY - 20,
  11,
  'Arial',
  '#999'
);

fundamentalNotes.forEach((note, rowIndex) => {
  const y = startY + rowIndex * 55;

  // Row label
  renderer.drawText(note.romaji, 10, y + 5, 11, 'Arial', '#666');

  // Natural (no mark)
  const naturalX = startX + noteSpacing * 0;
  renderer.drawText(note.kana, naturalX - 12, y, 32, 'Noto Sans JP', '#333');

  // Meri
  const meriX = startX + noteSpacing * 1;
  renderer.drawText(note.kana, meriX - 12, y, 32, 'Noto Sans JP', '#333');
  const meriMod = new MeriKariModifier('meri');
  meriMod.render(renderer, meriX, y);

  // Dai-meri
  const daiMeriX = startX + noteSpacing * 2;
  renderer.drawText(note.kana, daiMeriX - 12, y, 32, 'Noto Sans JP', '#333');
  const daiMeriMod = new MeriKariModifier('dai-meri');
  daiMeriMod.render(renderer, daiMeriX, y);

  // Kari
  const kariX = startX + noteSpacing * 3;
  renderer.drawText(note.kana, kariX - 12, y, 32, 'Noto Sans JP', '#333');
  const kariMod = new MeriKariModifier('kari');
  kariMod.render(renderer, kariX, y);
});

console.log('  ✓ Five notes with all alteration types');

// Test 3: Combined with octave dots
console.log('\nTest 3: Combining meri/kari with octave dots');

renderer.drawText(
  'Combined Modifiers (octave + pitch):',
  550,
  230,
  14,
  'Arial',
  '#666'
);

const combinedNotes = [
  {
    x: 580,
    y: 280,
    kana: 'ツ',
    label: 'kan + meri',
    mods: [new OctaveDotsModifier(1, 'above'), new MeriKariModifier('meri')],
  },
  {
    x: 680,
    y: 280,
    kana: 'レ',
    label: 'daikan + kari',
    mods: [new OctaveDotsModifier(2, 'above'), new MeriKariModifier('kari')],
  },
  {
    x: 780,
    y: 280,
    kana: 'チ',
    label: 'kan + dai-meri',
    mods: [
      new OctaveDotsModifier(1, 'above'),
      new MeriKariModifier('dai-meri'),
    ],
  },
];

combinedNotes.forEach((note) => {
  renderer.drawText(note.kana, note.x - 12, note.y, 32, 'Noto Sans JP', '#333');
  note.mods.forEach((mod) => mod.render(renderer, note.x, note.y));

  // Label
  renderer.drawText(note.label, note.x - 35, note.y + 30, 10, 'Arial', '#666');
});

console.log('  ✓ Combined with octave dots');

// Test 4: Custom styling
console.log('\nTest 4: Custom styling');

renderer.drawText('Custom Styling:', 20, 410, 16, 'Arial', '#666');

const customNotes = [
  {
    x: 100,
    y: 460,
    kana: 'ロ',
    label: 'blue, thick',
    mod: new MeriKariModifier('meri').setColor('#2196F3').setStrokeWidth(3),
  },
  {
    x: 200,
    y: 460,
    kana: 'ツ',
    label: 'green, long',
    mod: new MeriKariModifier('kari').setColor('#4CAF50').setMarkLength(28),
  },
  {
    x: 300,
    y: 460,
    kana: 'レ',
    label: 'orange, wide',
    mod: new MeriKariModifier('dai-meri')
      .setColor('#FF9800')
      .setDoubleSpacing(8),
  },
  {
    x: 400,
    y: 460,
    kana: 'チ',
    label: 'purple, right',
    mod: new MeriKariModifier('meri', 'right').setColor('#9C27B0'),
  },
];

customNotes.forEach((note) => {
  renderer.drawText(note.kana, note.x - 12, note.y, 32, 'Noto Sans JP', '#333');
  note.mod.render(renderer, note.x, note.y);

  // Label
  renderer.drawText(note.label, note.x - 30, note.y + 30, 10, 'Arial', '#666');
});

console.log('  ✓ Custom colors, thickness, length, spacing, position');

// Test 5: Realistic shakuhachi phrase with alterations
console.log('\nTest 5: Realistic phrase with pitch alterations');

renderer.drawText(
  'Sample Phrase: Kinko-ryū melodic line',
  20,
  530,
  14,
  'Arial',
  '#666'
);

// A melodic line with various pitch alterations
const phrase = [
  { kana: 'ロ', octave: null, alter: null },
  { kana: 'ツ', octave: 'kan', alter: 'meri' },
  { kana: 'レ', octave: 'kan', alter: null },
  { kana: 'ロ', octave: null, alter: 'meri' },
  { kana: 'ツ', octave: null, alter: null },
  { kana: 'チ', octave: 'kan', alter: 'kari' },
  { kana: 'レ', octave: 'kan', alter: null },
  { kana: 'ツ', octave: 'kan', alter: 'dai-meri' },
];

phrase.forEach((note, index) => {
  const x = 50 + index * 70;
  const y = 580;

  // Draw note
  renderer.drawText(note.kana, x - 12, y, 28, 'Noto Sans JP', '#333');

  // Add octave dots
  if (note.octave === 'kan') {
    const dotMod = new OctaveDotsModifier(1, 'above');
    dotMod.render(renderer, x, y);
  } else if (note.octave === 'daikan') {
    const dotMod = new OctaveDotsModifier(2, 'above');
    dotMod.render(renderer, x, y);
  }

  // Add pitch alteration
  if (note.alter) {
    const altMod = new MeriKariModifier(note.alter);
    altMod.render(renderer, x, y);
  }
});

console.log('  ✓ Realistic phrase with combined modifiers');

// Summary
console.log('\n✅ All MeriKariModifier tests complete!');
console.log('📊 Test Results:');
console.log('  ✓ Basic meri, dai-meri, and kari marks');
console.log('  ✓ All five fundamental notes with alterations');
console.log('  ✓ Combined with octave dots (multiple modifiers per note)');
console.log('  ✓ Custom styling (color, thickness, length, spacing, position)');
console.log('  ✓ Realistic phrase rendering');
console.log('  ✓ Visual distinction: meri (/), dai-meri (//), kari (\\)');
console.log('  ✓ Ready for use in ShakuNote class!');

console.log('\n🎨 Visual test complete - check the browser!');
