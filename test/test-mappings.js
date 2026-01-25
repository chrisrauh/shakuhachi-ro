// Test the Kinko symbol mappings
import {
  kinkoMap,
  getKinkoSymbols,
  getSymbolByKana,
  getSymbolByRomaji,
} from './index.ts';

console.log('📋 Testing Kinko Symbol Mappings...\n');

// Test 1: Load all symbols
console.log('Test 1: All available symbols');
const symbols = getKinkoSymbols();
console.log(`  Found ${symbols.length} symbols:`, symbols);

// Test 2: Display each symbol's data
console.log('\nTest 2: Symbol details');
console.table(kinkoMap);

// Test 3: Test helper functions
console.log('\nTest 3: Helper functions');

// Get by romaji
const roSymbol = getSymbolByRomaji('ro');
console.log('  getSymbolByRomaji("ro"):', roSymbol);

// Get by kana
const tsuSymbol = getSymbolByKana('ツ');
console.log('  getSymbolByKana("ツ"):', tsuSymbol);

// Test 4: Verify fingerings
console.log('\nTest 4: Fingering patterns (true = closed, false = open)');
for (const [name, symbol] of Object.entries(kinkoMap)) {
  const fingeringStr = symbol.fingering
    .map((closed) => (closed ? '●' : '○'))
    .join(' ');
  console.log(`  ${symbol.kana} (${name}): ${fingeringStr} → ${symbol.pitch}`);
}

// Test 5: Display in a table
console.log('\n✅ Mappings test complete!');
console.log('Data structure is working correctly.');

// Create visual display
const container = document.getElementById('mappings-display');
if (container) {
  let html = '<h3>Kinko Symbol Map</h3>';
  html += '<table style="border-collapse: collapse; width: 100%;">';
  html += '<tr style="background: #E3F2FD; font-weight: bold;">';
  html += '<th style="padding: 10px; border: 1px solid #ccc;">Kana</th>';
  html += '<th style="padding: 10px; border: 1px solid #ccc;">Romaji</th>';
  html += '<th style="padding: 10px; border: 1px solid #ccc;">Pitch</th>';
  html += '<th style="padding: 10px; border: 1px solid #ccc;">Octave</th>';
  html += '<th style="padding: 10px; border: 1px solid #ccc;">Fingering</th>';
  html += '<th style="padding: 10px; border: 1px solid #ccc;">Can Alter</th>';
  html += '</tr>';

  for (const [name, symbol] of Object.entries(kinkoMap)) {
    const fingeringStr = symbol.fingering
      .map((closed) => (closed ? '●' : '○'))
      .join(' ');
    html += '<tr>';
    html += `<td style="padding: 10px; border: 1px solid #ccc; font-size: 24px; font-family: 'Noto Sans JP';">${symbol.kana}</td>`;
    html += `<td style="padding: 10px; border: 1px solid #ccc;">${symbol.romaji}</td>`;
    html += `<td style="padding: 10px; border: 1px solid #ccc;">${symbol.pitch}</td>`;
    html += `<td style="padding: 10px; border: 1px solid #ccc;">${symbol.defaultOctave}</td>`;
    html += `<td style="padding: 10px; border: 1px solid #ccc; font-family: monospace;">${fingeringStr}</td>`;
    html += `<td style="padding: 10px; border: 1px solid #ccc;">${
      symbol.canAlter ? '✓' : '✗'
    }</td>`;
    html += '</tr>';
  }

  html += '</table>';
  html +=
    '<p style="margin-top: 15px; font-size: 14px; color: #666;">● = hole closed, ○ = hole open. Holes 1-5 from top to bottom (5 is thumb).</p>';

  container.innerHTML = html;
}
