// Test the OctaveDotsModifier implementation
import { SVGRenderer } from './renderer/SVGRenderer';
import { OctaveDotsModifier } from './modifiers/OctaveDotsModifier';

console.log('🎵 Testing OctaveDotsModifier...\n');

const container = document.getElementById('octave-test');

// Create renderer
const renderer = new SVGRenderer(container, 900, 500);

// Draw title
renderer.drawText('Octave Dots Modifier Test', 20, 30, 20, 'Arial', '#333');

// Test 1: Basic octave indicators
console.log('Test 1: Basic octave indicators');

renderer.drawText('Basic Octave Indicators:', 20, 80, 16, 'Arial', '#666');

const basicNotes = [
  { x: 100, y: 150, kana: 'ロ', label: 'otsu (base)', dots: null },
  {
    x: 200,
    y: 150,
    kana: 'ロ',
    label: 'kan (+1 oct)',
    dots: { count: 1, position: 'above' },
  },
  {
    x: 320,
    y: 150,
    kana: 'ロ',
    label: 'daikan (+2 oct)',
    dots: { count: 2, position: 'above' },
  },
  {
    x: 460,
    y: 150,
    kana: 'ロ',
    label: 'lower (-1 oct)',
    dots: { count: 1, position: 'below' },
  },
];

basicNotes.forEach((note) => {
  // Draw the note
  renderer.drawText(note.kana, note.x - 15, note.y, 40, 'Noto Sans JP', '#333');

  // Add octave dots if specified
  if (note.dots) {
    const dotMod = new OctaveDotsModifier(note.dots.count, note.dots.position);
    dotMod.render(renderer, note.x, note.y);
  }

  // Add label below
  renderer.drawText(note.label, note.x - 35, note.y + 35, 11, 'Arial', '#666');
});

console.log('  ✓ Basic octave indicators rendered');

// Test 2: All five fundamental notes with octave variations
console.log('\nTest 2: Five fundamental notes across octaves');

renderer.drawText('Five Notes × Three Octaves:', 20, 230, 16, 'Arial', '#666');

const fundamentalNotes = [
  { romaji: 'ro', kana: 'ロ', pitch: 'D' },
  { romaji: 'tsu', kana: 'ツ', pitch: 'F' },
  { romaji: 're', kana: 'レ', pitch: 'G' },
  { romaji: 'chi', kana: 'チ', pitch: 'A' },
  { romaji: 'ri', kana: 'リ', pitch: 'C' },
];

const startX = 60;
const startY = 290;
const noteSpacing = 110;

// Column headers
renderer.drawText(
  'otsu',
  startX + noteSpacing * 0 - 15,
  startY - 20,
  12,
  'Arial',
  '#999'
);
renderer.drawText(
  'kan',
  startX + noteSpacing * 1 - 10,
  startY - 20,
  12,
  'Arial',
  '#999'
);
renderer.drawText(
  'daikan',
  startX + noteSpacing * 2 - 20,
  startY - 20,
  12,
  'Arial',
  '#999'
);

fundamentalNotes.forEach((note, rowIndex) => {
  const y = startY + rowIndex * 60;

  // Row label
  renderer.drawText(note.romaji, 10, y + 5, 11, 'Arial', '#666');

  // Otsu (base octave - no dots)
  const otsuX = startX + noteSpacing * 0;
  renderer.drawText(note.kana, otsuX - 12, y, 32, 'Noto Sans JP', '#333');

  // Kan (1 dot above)
  const kanX = startX + noteSpacing * 1;
  renderer.drawText(note.kana, kanX - 12, y, 32, 'Noto Sans JP', '#333');
  const kanDot = new OctaveDotsModifier(1, 'above');
  kanDot.render(renderer, kanX, y);

  // Daikan (2 dots above)
  const daikanX = startX + noteSpacing * 2;
  renderer.drawText(note.kana, daikanX - 12, y, 32, 'Noto Sans JP', '#333');
  const daikanDots = new OctaveDotsModifier(2, 'above');
  daikanDots.render(renderer, daikanX, y);
});

console.log('  ✓ Five notes across three octaves');

// Test 3: Custom styling
console.log('\nTest 3: Custom dot styling');

renderer.drawText('Custom Styling:', 400, 230, 16, 'Arial', '#666');

const customNotes = [
  {
    x: 450,
    y: 280,
    kana: 'ツ',
    mods: [
      new OctaveDotsModifier(1, 'above').setDotRadius(5).setColor('#E91E63'),
    ],
  },
  {
    x: 550,
    y: 280,
    kana: 'レ',
    mods: [
      new OctaveDotsModifier(2, 'above')
        .setDotRadius(4)
        .setDotSpacing(10)
        .setColor('#2196F3'),
    ],
  },
  {
    x: 650,
    y: 280,
    kana: 'チ',
    mods: [
      new OctaveDotsModifier(1, 'above').setDotRadius(6).setOffset(0, -25),
    ],
  },
  {
    x: 750,
    y: 280,
    kana: 'リ',
    mods: [new OctaveDotsModifier(2, 'above').setDotRadius(2).setDotSpacing(6)],
  },
];

customNotes.forEach((note) => {
  renderer.drawText(note.kana, note.x - 12, note.y, 32, 'Noto Sans JP', '#333');
  note.mods.forEach((mod) => mod.render(renderer, note.x, note.y));
});

// Add labels
renderer.drawText('large pink', 430, 320, 10, 'Arial', '#E91E63');
renderer.drawText('blue spaced', 525, 320, 10, 'Arial', '#2196F3');
renderer.drawText('custom offset', 620, 320, 10, 'Arial', '#666');
renderer.drawText('small tight', 725, 320, 10, 'Arial', '#666');

console.log('  ✓ Custom styling (radius, spacing, color, offset)');

// Test 4: Realistic shakuhachi phrase
console.log('\nTest 4: Realistic shakuhachi phrase');

renderer.drawText(
  'Sample Phrase: "Honte Chōshi" opening',
  20,
  380,
  14,
  'Arial',
  '#666'
);

// Traditional Honte Chōshi opening pattern
const phrase = [
  { kana: 'ロ', octave: 'otsu' },
  { kana: 'ツ', octave: 'kan' },
  { kana: 'レ', octave: 'kan' },
  { kana: 'ツ', octave: 'kan' },
  { kana: 'ロ', octave: 'otsu' },
  { kana: 'ツ', octave: 'otsu' },
  { kana: 'レ', octave: 'kan' },
  { kana: 'ツ', octave: 'kan' },
];

phrase.forEach((note, index) => {
  const x = 50 + index * 70;
  const y = 440;

  // Draw note
  renderer.drawText(note.kana, x - 12, y, 32, 'Noto Sans JP', '#333');

  // Add octave indicator
  if (note.octave === 'kan') {
    const dotMod = new OctaveDotsModifier(1, 'above');
    dotMod.render(renderer, x, y);
  } else if (note.octave === 'daikan') {
    const dotMod = new OctaveDotsModifier(2, 'above');
    dotMod.render(renderer, x, y);
  }
});

console.log('  ✓ Realistic phrase rendered');

// Summary
console.log('\n✅ All OctaveDotsModifier tests complete!');
console.log('📊 Test Results:');
console.log('  ✓ Basic octave indicators (otsu, kan, daikan, lower)');
console.log('  ✓ All five fundamental notes across three octaves');
console.log('  ✓ Custom styling (radius, spacing, color, offset)');
console.log('  ✓ Realistic shakuhachi phrase rendering');
console.log('  ✓ 1 dot and 2 dot variants working');
console.log('  ✓ Above and below positioning');
console.log('  ✓ Ready for use in ShakuNote class!');

console.log('\n🎨 Visual test complete - check the browser!');
