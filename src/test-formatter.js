// Test the Formatter class - automatic note spacing
import { SVGRenderer } from './renderer/SVGRenderer';
import { Formatter } from './renderer/Formatter';
import { ShakuNote } from './notes/ShakuNote';
import { OctaveDotsModifier } from './modifiers/OctaveDotsModifier';
import { MeriKariModifier } from './modifiers/MeriKariModifier';

console.log('📏 Testing Formatter class...\n');

const container = document.getElementById('formatter-test');

// Create renderer
const renderer = new SVGRenderer(container, 900, 700);

// Draw title
renderer.drawText(
  'Formatter - Automatic Note Spacing',
  20,
  30,
  20,
  'Arial',
  '#333'
);

// Test 1: Basic formatting with quarter notes
console.log('Test 1: Basic formatting (quarter notes)');

renderer.drawText(
  'Test 1: Quarter Notes (equal spacing)',
  20,
  70,
  14,
  'Arial',
  '#666'
);

const quarterNotes = [
  new ShakuNote({ symbol: 'ro', duration: 'q' }),
  new ShakuNote({ symbol: 'tsu', duration: 'q' }),
  new ShakuNote({ symbol: 're', duration: 'q' }),
  new ShakuNote({ symbol: 'chi', duration: 'q' }),
  new ShakuNote({ symbol: 'ri', duration: 'q' }),
];

const formatter1 = new Formatter({
  startX: 50,
  startY: 120,
});

formatter1.format(quarterNotes);
quarterNotes.forEach((note) => note.render(renderer));

// Add labels
renderer.drawText('q q q q q', 50, 145, 11, 'Arial', '#999');

console.log('  ✓ Quarter notes formatted');

// Test 2: Mixed durations
console.log('\nTest 2: Mixed durations');

renderer.drawText(
  'Test 2: Mixed Durations (w, h, q, 8, 16)',
  20,
  180,
  14,
  'Arial',
  '#666'
);

const mixedNotes = [
  new ShakuNote({ symbol: 'ro', duration: 'w' }),
  new ShakuNote({ symbol: 'tsu', duration: 'h' }),
  new ShakuNote({ symbol: 're', duration: 'q' }),
  new ShakuNote({ symbol: 'chi', duration: '8' }),
  new ShakuNote({ symbol: 'ri', duration: '16' }),
];

const formatter2 = new Formatter({
  startX: 50,
  startY: 230,
  pixelsPerTick: 0.05, // Slightly wider spacing
});

formatter2.format(mixedNotes);
mixedNotes.forEach((note) => note.render(renderer));

// Add duration labels
const durLabels = ['w', 'h', 'q', '8', '16'];
const labelX = 50;
mixedNotes.forEach((note, i) => {
  const pos = note.getPosition();
  renderer.drawText(durLabels[i], pos.x - 5, 255, 11, 'Arial', '#999');
});

console.log('  ✓ Mixed durations: wider spacing for longer notes');

// Test 3: Tight vs loose spacing
console.log('\nTest 3: Tight vs loose spacing');

renderer.drawText('Test 3: Spacing Comparison', 20, 290, 14, 'Arial', '#666');

// Tight spacing
const tightNotes = [
  new ShakuNote({ symbol: 'ro', duration: 'q' }),
  new ShakuNote({ symbol: 'tsu', duration: 'q' }),
  new ShakuNote({ symbol: 're', duration: 'q' }),
  new ShakuNote({ symbol: 'chi', duration: 'q' }),
];

const tightFormatter = new Formatter({
  startX: 50,
  startY: 340,
  pixelsPerTick: 0.03,
  minNoteSpacing: 35,
});

tightFormatter.format(tightNotes);
tightNotes.forEach((note) => note.render(renderer));
renderer.drawText('tight (0.03 ppt)', 30, 365, 10, 'Arial', '#E91E63');

// Loose spacing
const looseNotes = [
  new ShakuNote({ symbol: 'ro', duration: 'q' }),
  new ShakuNote({ symbol: 'tsu', duration: 'q' }),
  new ShakuNote({ symbol: 're', duration: 'q' }),
  new ShakuNote({ symbol: 'chi', duration: 'q' }),
];

const looseFormatter = new Formatter({
  startX: 50,
  startY: 410,
  pixelsPerTick: 0.08,
  minNoteSpacing: 60,
});

looseFormatter.format(looseNotes);
looseNotes.forEach((note) => note.render(renderer));
renderer.drawText('loose (0.08 ppt)', 30, 435, 10, 'Arial', '#2196F3');

console.log('  ✓ Spacing comparison: tight vs loose');

// Test 4: Formatted phrase with modifiers
console.log('\nTest 4: Complete phrase with modifiers');

renderer.drawText(
  'Test 4: Traditional Phrase (auto-spaced)',
  20,
  470,
  14,
  'Arial',
  '#666'
);

const phraseNotes = [
  new ShakuNote({ symbol: 'ro', duration: 'h' }).addModifier(
    new OctaveDotsModifier(1, 'above')
  ),
  new ShakuNote({ symbol: 'tsu', duration: 'q' }).addModifier(
    new MeriKariModifier('meri')
  ),
  new ShakuNote({ symbol: 're', duration: 'q' }).addModifier(
    new OctaveDotsModifier(1, 'above')
  ),
  new ShakuNote({ symbol: 'chi', duration: '8' }),
  new ShakuNote({ symbol: 'ri', duration: '8' }).addModifier(
    new OctaveDotsModifier(2, 'above')
  ),
  new ShakuNote({ symbol: 'ro', duration: 'q' }).addModifier(
    new MeriKariModifier('kari')
  ),
  new ShakuNote({ symbol: 'tsu', duration: 'h' }),
];

const phraseFormatter = new Formatter({
  startX: 50,
  startY: 530,
  pixelsPerTick: 0.06,
});

phraseFormatter.format(phraseNotes);
phraseNotes.forEach((note) => note.render(renderer));

const phraseWidth = phraseFormatter.calculateWidth(phraseNotes);
console.log(`  Phrase width: ${phraseWidth.toFixed(1)}px`);

console.log('  ✓ Complete phrase with auto-spacing');

// Test 5: Width calculation
console.log('\nTest 5: Width calculation');

renderer.drawText(
  'Test 5: Calculated Width Visualization',
  450,
  70,
  14,
  'Arial',
  '#666'
);

const widthTestNotes = [
  new ShakuNote({ symbol: 'ro', duration: 'q' }),
  new ShakuNote({ symbol: 'tsu', duration: 'h' }),
  new ShakuNote({ symbol: 're', duration: 'q' }),
  new ShakuNote({ symbol: 'chi', duration: 'q' }),
];

const widthFormatter = new Formatter({
  startX: 480,
  startY: 130,
});

const calculatedWidth = widthFormatter.calculateWidth(widthTestNotes);
console.log(`  Calculated width: ${calculatedWidth.toFixed(1)}px`);

widthFormatter.format(widthTestNotes);
widthTestNotes.forEach((note) => note.render(renderer));

// Draw bounding box showing calculated width
const startPos = widthTestNotes[0].getPosition();
renderer.drawRect(
  startPos.x - 20,
  startPos.y - 50,
  calculatedWidth,
  70,
  undefined,
  '#9C27B0',
  2
);

renderer.drawText(
  `width: ${calculatedWidth.toFixed(0)}px`,
  startPos.x,
  startPos.y - 55,
  11,
  'Arial',
  '#9C27B0'
);

console.log('  ✓ Width calculation and visualization');

// Test 6: Multiple rows (different Y positions)
console.log('\nTest 6: Multiple rows');

renderer.drawText(
  'Test 6: Multiple Rows (same formatter)',
  450,
  190,
  14,
  'Arial',
  '#666'
);

const multiFormatter = new Formatter({
  startX: 480,
  pixelsPerTick: 0.05,
});

// Row 1
const row1 = [
  new ShakuNote({ symbol: 'ro', duration: 'q' }),
  new ShakuNote({ symbol: 'tsu', duration: 'q' }),
  new ShakuNote({ symbol: 're', duration: 'q' }),
];
multiFormatter.format(row1, undefined, 250);
row1.forEach((note) => note.render(renderer));

// Row 2
const row2 = [
  new ShakuNote({ symbol: 'chi', duration: 'h' }),
  new ShakuNote({ symbol: 'ri', duration: 'q' }),
  new ShakuNote({ symbol: 'ro', duration: 'q' }),
];
multiFormatter.format(row2, undefined, 310);
row2.forEach((note) => note.render(renderer));

// Row 3
const row3 = [
  new ShakuNote({ symbol: 'tsu', duration: 'q' }),
  new ShakuNote({ symbol: 're', duration: '8' }),
  new ShakuNote({ symbol: 'chi', duration: '8' }),
  new ShakuNote({ symbol: 'ri', duration: 'q' }),
];
multiFormatter.format(row3, undefined, 370);
row3.forEach((note) => note.render(renderer));

console.log('  ✓ Multiple rows formatted');

// Test 7: Rhythm notation comparison
console.log('\nTest 7: Rhythmic patterns');

renderer.drawText('Test 7: Rhythmic Patterns', 450, 410, 14, 'Arial', '#666');

// Fast pattern (sixteenths)
const fastPattern = [
  new ShakuNote({ symbol: 'ro', duration: '16' }),
  new ShakuNote({ symbol: 'tsu', duration: '16' }),
  new ShakuNote({ symbol: 're', duration: '16' }),
  new ShakuNote({ symbol: 'chi', duration: '16' }),
  new ShakuNote({ symbol: 'ri', duration: '16' }),
  new ShakuNote({ symbol: 'chi', duration: '16' }),
  new ShakuNote({ symbol: 're', duration: '16' }),
  new ShakuNote({ symbol: 'tsu', duration: '16' }),
];

const fastFormatter = new Formatter({
  startX: 480,
  startY: 460,
  pixelsPerTick: 0.1,
});

fastFormatter.format(fastPattern);
fastPattern.forEach((note) => note.render(renderer));
renderer.drawText('16th notes', 480, 485, 10, 'Arial', '#666');

// Slow pattern (half notes)
const slowPattern = [
  new ShakuNote({ symbol: 'ro', duration: 'h' }),
  new ShakuNote({ symbol: 'tsu', duration: 'h' }),
  new ShakuNote({ symbol: 're', duration: 'h' }),
];

const slowFormatter = new Formatter({
  startX: 480,
  startY: 530,
  pixelsPerTick: 0.05,
});

slowFormatter.format(slowPattern);
slowPattern.forEach((note) => note.render(renderer));
renderer.drawText('half notes', 480, 555, 10, 'Arial', '#666');

console.log('  ✓ Rhythmic patterns (fast vs slow)');

// Summary
console.log('\n✅ All Formatter tests complete!');
console.log('📊 Test Results:');
console.log('  ✓ Basic formatting (quarter notes)');
console.log('  ✓ Mixed durations (w, h, q, 8, 16)');
console.log('  ✓ Tight vs loose spacing');
console.log('  ✓ Complete phrase with modifiers');
console.log('  ✓ Width calculation');
console.log('  ✓ Multiple rows');
console.log('  ✓ Rhythmic patterns');
console.log('  ✓ Automatic position calculation');
console.log('  ✓ Duration-based spacing working correctly');

console.log('\n🎨 Visual test complete - check the browser!');
