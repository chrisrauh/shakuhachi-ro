// SVGRenderer Visual Test Suite
// Tests all drawing primitives and features
import { SVGRenderer } from './index.ts';

console.log('🔥 SVGRenderer Test Suite Loading...');

const container = document.getElementById('svg-container');

// Create renderer
const renderer = new SVGRenderer(container, 1000, 600);

// === Test 1: Text Rendering (including Japanese kana) ===
console.log('Test 1: Text rendering');
renderer.drawText('SVGRenderer Tests', 20, 30, 20, 'Arial', '#333');
renderer.drawText(
  'Japanese Kana: ロ ツ レ チ リ',
  20,
  60,
  32,
  'Noto Sans JP, sans-serif',
  '#2196F3'
);

// === Test 2: Circles ===
console.log('Test 2: Circles');
// Filled circle
renderer.drawCircle(50, 150, 25, '#4CAF50');
// Stroked circle (no fill)
renderer.drawCircle(120, 150, 25, undefined, '#E91E63', 2);
// Filled + stroked circle
renderer.drawCircle(190, 150, 25, '#FFC107', '#FF5722', 3);

// === Test 3: Lines ===
console.log('Test 3: Lines');
renderer.drawLine(250, 120, 350, 120, '#9C27B0', 1);
renderer.drawLine(250, 140, 350, 140, '#3F51B5', 3);
renderer.drawLine(250, 165, 350, 165, '#009688', 5);

// === Test 4: Rectangles ===
console.log('Test 4: Rectangles');
renderer.drawRect(380, 120, 60, 60, '#FFEB3B');
renderer.drawRect(460, 120, 60, 60, undefined, '#F44336', 2);
renderer.drawRect(540, 120, 60, 60, '#E1BEE7', '#9C27B0', 2);

// === Test 5: Paths ===
console.log('Test 5: Paths');
// Simple triangle path
const trianglePath = 'M 650 120 L 680 180 L 620 180 Z';
renderer.drawPath(trianglePath, '#00BCD4', '#09545dff', 2);

// Curved path (like meri/kari arrows)
const curvedPath = 'M 720 120 Q 750 150 720 180';
renderer.drawPath(curvedPath, undefined, '#FF9800', 3);

// === Test 6: Group Management with Transform ===
console.log('Test 6: Group management and transforms');
const testGroup = renderer.openGroup('test-group', 'my-test-group');

// Draw content inside group
renderer.drawText('ロ', 50, 280, 48, 'Noto Sans JP', '#333');
renderer.drawCircle(80, 260, 8, '#69545bff');
renderer.drawCircle(80, 300, 8, '#E91E63');

renderer.closeGroup();

// Apply rotation transform to the group (VexFlow pattern)
testGroup.setAttribute('transform', 'rotate(15 65 280)');

// === Test 7: Nested Groups ===
console.log('Test 7: Nested groups');
renderer.openGroup('outer-group');
renderer.drawRect(150, 240, 100, 80, '#E8F5E9', '#4CAF50', 2);

const innerGroup = renderer.openGroup('inner-group');
renderer.drawText('ツ', 175, 285, 40, 'Noto Sans JP', '#2E7D32');
renderer.closeGroup();

innerGroup.setAttribute('transform', 'translate(5, 5)');
renderer.closeGroup();

// === Test 8: Multiple Kana with Modifiers Simulation ===
console.log('Test 8: Kana with modifier simulation');
renderer.openGroup('kana-with-modifiers');

// Note "レ" with dots above (octave marker simulation)
renderer.drawText('レ', 300, 285, 40, 'Noto Sans JP', '#333');
renderer.drawCircle(315, 250, 4, '#000'); // Octave dot

// Note "チ" with line to the left (meri marker simulation)
renderer.drawText('チ', 360, 285, 40, 'Noto Sans JP', '#333');
renderer.drawLine(355, 270, 355, 290, '#E91E63', 2); // Meri mark

// Note "リ" with two dots below (lower octave simulation)
renderer.drawText('リ', 420, 285, 40, 'Noto Sans JP', '#333');
renderer.drawCircle(435, 300, 4, '#000'); // First dot
renderer.drawCircle(435, 310, 4, '#000'); // Second dot

renderer.closeGroup();

// === Test 9: Vertical Layout Simulation ===
console.log('Test 9: Vertical layout preview (rotated group)');
const verticalGroup = renderer.openGroup('vertical-test');

// Draw horizontal sequence
renderer.drawText('ロ', 520, 285, 32, 'Noto Sans JP', '#333');
renderer.drawText('ツ', 565, 285, 32, 'Noto Sans JP', '#333');
renderer.drawText('レ', 610, 285, 32, 'Noto Sans JP', '#333');

renderer.closeGroup();

// Rotate to vertical (like traditional shakuhachi scores)
verticalGroup.setAttribute('transform', 'rotate(-90 565 280)');

// === Test 10: Precision Test ===
console.log('Test 10: Coordinate precision (should round to 3 decimals)');
renderer.drawCircle(700.123456, 270.987654, 5, '#FF5722');
renderer.drawLine(720.111111, 260.999999, 750.777777, 290.888888, '#3F51B5', 2);

// === Summary ===
console.log('✅ All SVGRenderer tests complete!');
console.log('📊 Test Results:');
console.log('  ✓ Text rendering (English & Japanese)');
console.log('  ✓ Circles (filled, stroked, both)');
console.log('  ✓ Lines (various widths)');
console.log('  ✓ Rectangles (filled, stroked, both)');
console.log('  ✓ Paths (triangle, curves)');
console.log('  ✓ Group management (open/close)');
console.log('  ✓ Nested groups');
console.log('  ✓ Transforms (rotation, translate)');
console.log('  ✓ Shakuhachi notation simulation');
console.log('  ✓ Vertical layout preview');
console.log('  ✓ Coordinate precision');

console.log('\n🎨 Visual test complete - check the browser!');
console.log('💡 Try editing this file and watch it hot reload!');
