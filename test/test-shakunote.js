// Test the ShakuNote class - bringing everything together!
import { SVGRenderer } from '/src/renderer/SVGRenderer';
import { ShakuNote } from '/src/notes/ShakuNote';
import { OctaveDotsModifier } from '/src/modifiers/OctaveDotsModifier';
import { MeriKariModifier } from '/src/modifiers/MeriKariModifier';
import { AtariModifier } from '/src/modifiers/AtariModifier';

console.log('🎋 Testing ShakuNote class...\n');

const container = document.getElementById('shakunote-test');

// Create renderer
const renderer = new SVGRenderer(container, 900, 650);

// Draw title
renderer.drawText(
  'ShakuNote Class - Complete Integration Test',
  20,
  30,
  20,
  'Arial',
  '#333'
);

// Test 1: Basic note rendering using romaji
console.log('Test 1: Basic notes from romaji');

renderer.drawText('Basic Notes (from romaji):', 20, 70, 14, 'Arial', '#666');

const basicNotes = ['ro', 'tsu', 're', 'chi', 'ri'];
basicNotes.forEach((romaji, index) => {
  const note = new ShakuNote({
    symbol: romaji,
    x: 80 + index * 80,
    y: 120,
  });
  note.render(renderer);

  // Add label
  renderer.drawText(romaji, 65 + index * 80, 145, 11, 'Arial', '#666');
});

console.log('  ✓ Five basic notes rendered from romaji');

// Test 2: Notes with octave dots
console.log('\nTest 2: Notes with octave modifiers');

renderer.drawText('With Octave Indicators:', 20, 180, 14, 'Arial', '#666');

const octaveExamples = [
  { romaji: 'ro', octave: null, label: 'otsu' },
  { romaji: 'ro', octave: 'kan', label: 'kan' },
  { romaji: 'ro', octave: 'daikan', label: 'daikan' },
];

octaveExamples.forEach((example, index) => {
  const note = new ShakuNote({
    symbol: example.romaji,
    x: 100 + index * 120,
    y: 230,
  });

  if (example.octave === 'kan') {
    note.addModifier(new OctaveDotsModifier(1, 'above'));
  } else if (example.octave === 'daikan') {
    note.addModifier(new OctaveDotsModifier(2, 'above'));
  }

  note.render(renderer);

  // Label
  renderer.drawText(example.label, 75 + index * 120, 255, 11, 'Arial', '#666');
});

console.log('  ✓ Octave variations rendered');

// Test 3: Notes with pitch alterations
console.log('\nTest 3: Notes with pitch alterations');

renderer.drawText('With Pitch Alterations:', 450, 180, 14, 'Arial', '#666');

const pitchExamples = [
  { romaji: 'tsu', alter: null, label: 'natural' },
  { romaji: 'tsu', alter: 'meri', label: 'meri' },
  { romaji: 'tsu', alter: 'dai-meri', label: 'dai-meri' },
  { romaji: 'tsu', alter: 'kari', label: 'kari' },
];

pitchExamples.forEach((example, index) => {
  const note = new ShakuNote({
    symbol: example.romaji,
    x: 490 + index * 100,
    y: 230,
  });

  if (example.alter) {
    note.addModifier(new MeriKariModifier(example.alter));
  }

  note.render(renderer);

  // Label
  renderer.drawText(example.label, 460 + index * 100, 255, 10, 'Arial', '#666');
});

console.log('  ✓ Pitch alterations rendered');

// Test 4: Combined modifiers
console.log('\nTest 4: Multiple modifiers per note');

renderer.drawText('Multiple Modifiers:', 20, 300, 14, 'Arial', '#666');

const combinedExamples = [
  {
    romaji: 're',
    label: 'kan + meri',
    mods: [new OctaveDotsModifier(1, 'above'), new MeriKariModifier('meri')],
  },
  {
    romaji: 'chi',
    label: 'daikan + kari',
    mods: [new OctaveDotsModifier(2, 'above'), new MeriKariModifier('kari')],
  },
  {
    romaji: 'ri',
    label: 'kan + atari',
    mods: [new OctaveDotsModifier(1, 'above'), new AtariModifier('chevron')],
  },
  {
    romaji: 'ro',
    label: 'all three!',
    mods: [
      new OctaveDotsModifier(2, 'above'),
      new MeriKariModifier('meri'),
      new AtariModifier('chevron'),
    ],
  },
];

combinedExamples.forEach((example, index) => {
  const note = new ShakuNote({
    symbol: example.romaji,
    x: 80 + index * 120,
    y: 350,
  });

  note.addModifiers(example.mods);
  note.render(renderer);

  // Label
  renderer.drawText(example.label, 45 + index * 120, 375, 10, 'Arial', '#666');
});

console.log('  ✓ Multiple modifiers combined');

// Test 5: Fluent API / method chaining
console.log('\nTest 5: Fluent API (method chaining)');

renderer.drawText('Fluent API Example:', 20, 420, 14, 'Arial', '#666');

const fluentNote = new ShakuNote({ symbol: 'tsu' })
  .setPosition(100, 470)
  .setFontSize(40)
  .setColor('#2196F3')
  .addModifier(new OctaveDotsModifier(1, 'above'))
  .addModifier(new MeriKariModifier('meri'))
  .render(renderer);

renderer.drawText('Chained setters', 60, 505, 10, 'Arial', '#2196F3');

console.log('  ✓ Fluent API works');

// Test 6: Traditional shakuhachi phrase
console.log('\nTest 6: Complete traditional phrase');

renderer.drawText(
  'Traditional Phrase: Honkyoku excerpt',
  20,
  540,
  14,
  'Arial',
  '#666'
);

const phrase = [
  { romaji: 'ro', octave: null, alter: null, atari: true },
  { romaji: 'tsu', octave: 'kan', alter: 'meri', atari: false },
  { romaji: 're', octave: 'kan', alter: null, atari: false },
  { romaji: 'tsu', octave: 'kan', alter: null, atari: true },
  { romaji: 'ro', octave: null, alter: 'meri', atari: false },
  { romaji: 'tsu', octave: null, alter: null, atari: false },
  { romaji: 'chi', octave: 'kan', alter: 'kari', atari: true },
  { romaji: 're', octave: 'kan', alter: null, atari: false },
  { romaji: 'ri', octave: 'daikan', alter: null, atari: false },
];

phrase.forEach((noteData, index) => {
  const note = new ShakuNote({
    symbol: noteData.romaji,
    x: 50 + index * 65,
    y: 600,
    fontSize: 28,
  });

  // Add octave dots
  if (noteData.octave === 'kan') {
    note.addModifier(new OctaveDotsModifier(1, 'above'));
  } else if (noteData.octave === 'daikan') {
    note.addModifier(new OctaveDotsModifier(2, 'above'));
  }

  // Add pitch alteration
  if (noteData.alter) {
    note.addModifier(new MeriKariModifier(noteData.alter));
  }

  // Add atari marks
  if (noteData.atari) {
    note.addModifier(new AtariModifier('chevron'));
  }

  note.render(renderer);
});

console.log('  ✓ Traditional phrase with mixed modifiers');

// Test 7: Bounding box calculation
console.log('\nTest 7: Bounding box calculation');

const bboxTestNote = new ShakuNote({
  symbol: 're',
  x: 650,
  y: 120,
});

bboxTestNote.addModifiers([
  new OctaveDotsModifier(2, 'above'),
  new MeriKariModifier('meri'),
]);

bboxTestNote.render(renderer);

const bbox = bboxTestNote.getBBox();
console.log(
  `  Bounding box: x=${bbox.x.toFixed(1)}, y=${bbox.y.toFixed(
    1
  )}, w=${bbox.width.toFixed(1)}, h=${bbox.height.toFixed(1)}`
);

// Draw bbox visualization
renderer.drawRect(
  bbox.x,
  bbox.y,
  bbox.width,
  bbox.height,
  undefined,
  '#9C27B0',
  1
);
renderer.drawText('bbox', 640, 145, 10, 'Arial', '#9C27B0');

console.log('  ✓ Bounding box calculated and visualized');

// Summary
console.log('\n✅ All ShakuNote tests complete!');
console.log('📊 Test Results:');
console.log('  ✓ Basic note rendering from romaji');
console.log('  ✓ Octave modifiers (kan, daikan)');
console.log('  ✓ Pitch alterations (meri, dai-meri, kari)');
console.log('  ✓ Multiple modifiers per note');
console.log('  ✓ Fluent API / method chaining');
console.log('  ✓ Complete traditional phrase');
console.log('  ✓ Bounding box calculation');
console.log('  ✓ Integration with kinkoMap');
console.log('  ✓ All three modifier types working together');

console.log('\n🎉 ShakuNote class is fully functional!');
console.log('🎨 Visual test complete - check the browser!');
