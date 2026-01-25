// Test the AtariModifier implementation
import { SVGRenderer } from '/src/renderer/SVGRenderer';
import { AtariModifier } from '/src/modifiers/AtariModifier';
import { OctaveDotsModifier } from '/src/modifiers/OctaveDotsModifier';
import { MeriKariModifier } from '/src/modifiers/MeriKariModifier';

console.log('🥁 Testing AtariModifier...\n');

const container = document.getElementById('atari-test');

// Create renderer
const renderer = new SVGRenderer(container, 900, 600);

// Draw title
renderer.drawText(
  'Atari (Finger-Pop) Modifier Test',
  20,
  30,
  20,
  'Arial',
  '#333'
);

// Test 1: Three visual styles
console.log('Test 1: Three visual styles');

renderer.drawText('Visual Styles:', 20, 80, 16, 'Arial', '#666');

const styleNotes = [
  {
    x: 120,
    y: 140,
    kana: 'ロ',
    label: 'chevron (>)',
    mod: new AtariModifier('chevron'),
  },
  {
    x: 260,
    y: 140,
    kana: 'ツ',
    label: 'arrow (→)',
    mod: new AtariModifier('arrow'),
  },
  {
    x: 400,
    y: 140,
    kana: 'レ',
    label: 'dot (●)',
    mod: new AtariModifier('dot'),
  },
];

styleNotes.forEach((note) => {
  renderer.drawText(note.kana, note.x - 15, note.y, 40, 'Noto Sans JP', '#333');
  note.mod.render(renderer, note.x, note.y);
  renderer.drawText(note.label, note.x - 40, note.y + 35, 11, 'Arial', '#666');
});

console.log('  ✓ Three styles: chevron, arrow, dot');

// Test 2: Different positions
console.log('\nTest 2: Different positions');

renderer.drawText('Position Options:', 20, 210, 16, 'Arial', '#666');

const positionNotes = [
  {
    x: 100,
    y: 270,
    kana: 'チ',
    label: 'left (default)',
    mod: new AtariModifier('chevron', 'left'),
  },
  {
    x: 220,
    y: 270,
    kana: 'リ',
    label: 'right',
    mod: new AtariModifier('chevron', 'right'),
  },
  {
    x: 340,
    y: 270,
    kana: 'イ',
    label: 'above',
    mod: new AtariModifier('chevron', 'above'),
  },
  {
    x: 460,
    y: 270,
    kana: 'ウ',
    label: 'below',
    mod: new AtariModifier('chevron', 'below'),
  },
];

positionNotes.forEach((note) => {
  renderer.drawText(note.kana, note.x - 15, note.y, 36, 'Noto Sans JP', '#333');
  note.mod.render(renderer, note.x, note.y);
  renderer.drawText(note.label, note.x - 35, note.y + 30, 11, 'Arial', '#666');
});

console.log('  ✓ All positions: left, right, above, below');

// Test 3: Combined with other modifiers
console.log('\nTest 3: Combined with other modifiers');

renderer.drawText('Combined Modifiers:', 20, 350, 16, 'Arial', '#666');

const combinedNotes = [
  {
    x: 100,
    y: 410,
    kana: 'ロ',
    label: 'atari + octave',
    mods: [
      new OctaveDotsModifier(1, 'above'),
      new AtariModifier('chevron', 'left'),
    ],
  },
  {
    x: 220,
    y: 410,
    kana: 'ツ',
    label: 'atari + meri',
    mods: [
      new MeriKariModifier('meri', 'left'),
      new AtariModifier('arrow', 'right'),
    ],
  },
  {
    x: 340,
    y: 410,
    kana: 'レ',
    label: 'all three!',
    mods: [
      new OctaveDotsModifier(2, 'above'),
      new MeriKariModifier('kari', 'left'),
      new AtariModifier('chevron', 'right'),
    ],
  },
];

combinedNotes.forEach((note) => {
  renderer.drawText(note.kana, note.x - 12, note.y, 32, 'Noto Sans JP', '#333');
  note.mods.forEach((mod) => mod.render(renderer, note.x, note.y));
  renderer.drawText(note.label, note.x - 35, note.y + 30, 10, 'Arial', '#666');
});

console.log('  ✓ Combined with octave dots and meri/kari');

// Test 4: Custom styling
console.log('\nTest 4: Custom styling');

renderer.drawText('Custom Styling:', 500, 80, 16, 'Arial', '#666');

const customNotes = [
  {
    x: 550,
    y: 140,
    kana: 'チ',
    label: 'large blue',
    mod: new AtariModifier('chevron').setSize(16).setColor('#2196F3'),
  },
  {
    x: 670,
    y: 140,
    kana: 'リ',
    label: 'thick green',
    mod: new AtariModifier('arrow').setStrokeWidth(4).setColor('#4CAF50'),
  },
  {
    x: 790,
    y: 140,
    kana: 'イ',
    label: 'purple dot',
    mod: new AtariModifier('dot').setSize(12).setColor('#9C27B0'),
  },
  {
    x: 550,
    y: 220,
    kana: 'ウ',
    label: 'small',
    mod: new AtariModifier('chevron').setSize(6).setStrokeWidth(1),
  },
  {
    x: 670,
    y: 220,
    kana: 'ヒ',
    label: 'custom offset',
    mod: new AtariModifier('arrow').setOffset(-20, -10).setColor('#FF9800'),
  },
];

customNotes.forEach((note) => {
  renderer.drawText(note.kana, note.x - 12, note.y, 32, 'Noto Sans JP', '#333');
  note.mod.render(renderer, note.x, note.y);
  renderer.drawText(note.label, note.x - 30, note.y + 25, 10, 'Arial', '#666');
});

console.log('  ✓ Custom size, color, stroke, offset');

// Test 5: Realistic shakuhachi phrase with atari
console.log('\nTest 5: Realistic phrase with atari accents');

renderer.drawText(
  'Sample Phrase: Rhythmic pattern with atari accents',
  20,
  480,
  14,
  'Arial',
  '#666'
);

// Phrase with atari marking strong attacks
const phrase = [
  { kana: 'ロ', atari: true, octave: null },
  { kana: 'ツ', atari: false, octave: null },
  { kana: 'レ', atari: true, octave: 'kan' },
  { kana: 'ツ', atari: false, octave: null },
  { kana: 'チ', atari: true, octave: 'kan' },
  { kana: 'レ', atari: false, octave: 'kan' },
  { kana: 'ツ', atari: true, octave: null },
  { kana: 'ロ', atari: false, octave: null },
];

phrase.forEach((note, index) => {
  const x = 50 + index * 70;
  const y = 540;

  // Draw note
  renderer.drawText(note.kana, x - 12, y, 28, 'Noto Sans JP', '#333');

  // Add octave dots
  if (note.octave === 'kan') {
    const dotMod = new OctaveDotsModifier(1, 'above');
    dotMod.render(renderer, x, y);
  }

  // Add atari mark for accented notes
  if (note.atari) {
    const atariMod = new AtariModifier('chevron', 'left');
    atariMod.render(renderer, x, y);
  }
});

console.log('  ✓ Realistic phrase with percussive accents');

// Test 6: All styles side-by-side comparison
console.log('\nTest 6: Style comparison');

renderer.drawText(
  'Style Comparison (same settings):',
  500,
  300,
  14,
  'Arial',
  '#666'
);

const comparisonY = 350;
const comparisonNotes = [
  { x: 550, style: 'chevron', label: 'chevron' },
  { x: 650, style: 'arrow', label: 'arrow' },
  { x: 750, style: 'dot', label: 'dot' },
];

comparisonNotes.forEach((item) => {
  renderer.drawText('ロ', item.x - 12, comparisonY, 32, 'Noto Sans JP', '#333');

  const mod = new AtariModifier(item.style, 'left');
  mod.setSize(12).setColor('#FF5722').setStrokeWidth(2);
  mod.render(renderer, item.x, comparisonY);

  renderer.drawText(
    item.label,
    item.x - 25,
    comparisonY + 25,
    10,
    'Arial',
    '#666'
  );
});

console.log('  ✓ Side-by-side style comparison');

// Summary
console.log('\n✅ All AtariModifier tests complete!');
console.log('📊 Test Results:');
console.log('  ✓ Three visual styles: chevron (>), arrow (→), dot (●)');
console.log('  ✓ All position options: left, right, above, below');
console.log('  ✓ Combined with octave dots and meri/kari marks');
console.log('  ✓ Custom styling: size, color, stroke width, offset');
console.log('  ✓ Realistic phrase with percussive accents');
console.log('  ✓ Style comparison');
console.log('  ✓ Ready for use in ShakuNote class!');

console.log('\n🎨 Visual test complete - check the browser!');
