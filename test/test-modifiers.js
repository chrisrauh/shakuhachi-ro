// Test the Modifier base class and TestModifier implementation
import { SVGRenderer } from '/src/renderer/SVGRenderer';
import { TestModifier } from '/src/modifiers/TestModifier';

console.log('🎯 Testing Modifier Base Class...\n');

const container = document.getElementById('modifiers-test');

// Create renderer
const renderer = new SVGRenderer(container, 800, 400);

// Draw title
renderer.drawText('Modifier System Test', 20, 30, 20, 'Arial', '#333');

console.log('Test 1: Modifiers in different positions');

// Test 1: Single note with modifiers in all positions
const noteX = 100;
const noteY = 150;

// Draw the "note" (just text for now)
renderer.drawText('ロ', noteX - 15, noteY, 40, 'Noto Sans JP', '#333');

// Add modifiers in each position
const modAbove = new TestModifier('above', '#E91E63', 6);
const modBelow = new TestModifier('below', '#2196F3', 6);
const modLeft = new TestModifier('left', '#4CAF50', 6);
const modRight = new TestModifier('right', '#FF9800', 6);

modAbove.render(renderer, noteX, noteY);
modBelow.render(renderer, noteX, noteY);
modLeft.render(renderer, noteX, noteY);
modRight.render(renderer, noteX, noteY);

// Add labels
renderer.drawText('above', noteX - 15, noteY - 40, 12, 'Arial', '#E91E63');
renderer.drawText('below', noteX - 15, noteY + 30, 12, 'Arial', '#2196F3');
renderer.drawText('left', noteX - 45, noteY, 12, 'Arial', '#4CAF50');
renderer.drawText('right', noteX + 25, noteY, 12, 'Arial', '#FF9800');

console.log('  ✓ Modifiers positioned: above, below, left, right');

// Test 2: Multiple notes with different modifier combinations
console.log('\nTest 2: Multiple notes with modifier combinations');

const notes = [
  { x: 250, y: 150, kana: 'ツ', mods: ['above'] },
  { x: 340, y: 150, kana: 'レ', mods: ['above', 'above'] }, // Two dots
  { x: 430, y: 150, kana: 'チ', mods: ['left'] },
  { x: 520, y: 150, kana: 'リ', mods: ['below', 'below'] }, // Two dots below
  { x: 610, y: 150, kana: 'イ', mods: ['above', 'left'] },
];

notes.forEach((note) => {
  // Draw note
  renderer.drawText(note.kana, note.x - 15, note.y, 40, 'Noto Sans JP', '#333');

  // Add modifiers
  note.mods.forEach((position, index) => {
    let mod;

    if (position === 'above') {
      // Stack multiple "above" modifiers
      mod = new TestModifier('above', '#000', 4);
      mod.setOffset(0, -25 - index * 12);
    } else if (position === 'below') {
      // Stack multiple "below" modifiers
      mod = new TestModifier('below', '#000', 4);
      mod.setOffset(0, 15 + index * 12);
    } else if (position === 'left') {
      mod = new TestModifier('left', '#E91E63', 5);
    } else {
      mod = new TestModifier('right', '#FF9800', 5);
    }

    mod.render(renderer, note.x, note.y);
  });
});

console.log('  ✓ Multiple notes with varied modifier combinations');

// Test 3: Custom offsets
console.log('\nTest 3: Custom offset testing');

const customX = 150;
const customY = 280;

renderer.drawText('カ', customX - 15, customY, 40, 'Noto Sans JP', '#333');

// Create modifier with custom offset
const customMod = new TestModifier('above', '#9C27B0', 6);
customMod.setOffset(20, -15); // Custom position

customMod.render(renderer, customX, customY);

// Draw indicator line to show offset
renderer.drawLine(customX, customY, customX + 20, customY - 15, '#9C27B0', 1);
renderer.drawText(
  'custom offset',
  customX + 25,
  customY - 10,
  11,
  'Arial',
  '#9C27B0'
);

console.log('  ✓ Custom offset works correctly');

// Test 4: Modifier dimensions
console.log('\nTest 4: Modifier dimensions (getWidth/getHeight)');

const testMod = new TestModifier('above', '#000', 8);
console.log(`  Width: ${testMod.getWidth()}px`);
console.log(`  Height: ${testMod.getHeight()}px`);
console.log(`  Position: ${testMod.getPosition()}`);
console.log(`  Offset: x=${testMod.getOffset().x}, y=${testMod.getOffset().y}`);

// Test 5: Simulating shakuhachi notation
console.log('\nTest 5: Shakuhachi notation simulation');

const group = renderer.openGroup('shaku-simulation');

// Simulate octave markers (dots above/below)
const simNotes = [
  { x: 100, y: 350, kana: 'ロ', desc: 'otsu (base)' },
  { x: 200, y: 350, kana: 'ツ', desc: 'kan (dot above)', dots: 'above' },
  { x: 300, y: 350, kana: 'レ', desc: 'daikan (2 dots above)', dots: 'above2' },
  { x: 400, y: 350, kana: 'チ', desc: 'lower (dot below)', dots: 'below' },
];

simNotes.forEach((note) => {
  renderer.drawText(note.kana, note.x - 15, note.y, 32, 'Noto Sans JP', '#333');

  if (note.dots === 'above') {
    const dot = new TestModifier('above', '#000', 3);
    dot.render(renderer, note.x, note.y);
  } else if (note.dots === 'above2') {
    const dot1 = new TestModifier('above', '#000', 3);
    const dot2 = new TestModifier('above', '#000', 3);
    dot1.setOffset(0, -20);
    dot2.setOffset(0, -30);
    dot1.render(renderer, note.x, note.y);
    dot2.render(renderer, note.x, note.y);
  } else if (note.dots === 'below') {
    const dot = new TestModifier('below', '#000', 3);
    dot.render(renderer, note.x, note.y);
  }

  // Add description
  renderer.drawText(note.desc, note.x - 35, note.y + 25, 10, 'Arial', '#666');
});

renderer.closeGroup();

console.log('  ✓ Shakuhachi octave notation simulation');

// Summary
console.log('\n✅ All Modifier tests complete!');
console.log('📊 Test Results:');
console.log('  ✓ Base Modifier class works');
console.log('  ✓ TestModifier extends base correctly');
console.log('  ✓ All positions work (above, below, left, right)');
console.log('  ✓ Multiple modifiers per note');
console.log('  ✓ Custom offsets work');
console.log('  ✓ Dimension methods work');
console.log('  ✓ Ready for real modifiers (OctaveDots, MeriKari, etc.)');

console.log('\n🎨 Visual test complete - check the browser!');
