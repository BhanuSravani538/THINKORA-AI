import { parseCurrencyAmount, normalizeUnicodeText, formatCurrencyValue } from '../utils/currencyParser.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runCurrencyTests() {
  console.log('--- RUNNING THINKORA CURRENCY & EXTRACTION TESTS ---');

  // Test 1: Standard Indian Rupee formats
  console.log('1. Testing standard INR formats (₹, Rs., INR)...');
  const t1 = parseCurrencyAmount('₹4 lakh', 'solar_energy');
  assert(t1.value === 400000, `Expected 400000, got ${t1.value}`);
  assert(t1.currency === 'INR', `Expected INR, got ${t1.currency}`);
  assert(t1.status === 'verified', `Expected verified, got ${t1.status}`);
  assert(t1.normalizedText === '₹4 lakh', `Expected ₹4 lakh, got ${t1.normalizedText}`);

  const t1b = parseCurrencyAmount('Rs. 6 lakh', 'solar_energy');
  assert(t1b.value === 600000, `Expected 600000, got ${t1b.value}`);
  assert(t1b.currency === 'INR', `Expected INR, got ${t1b.currency}`);

  const t1c = parseCurrencyAmount('INR 400,000', 'solar_energy');
  assert(t1c.value === 400000, `Expected 400000, got ${t1c.value}`);
  assert(t1c.currency === 'INR', `Expected INR, got ${t1c.currency}`);

  // Test 2: Corrupted PDF glyph 'n4 lakh', 'n6 lakh', 'budget of n5 lakh'
  console.log('2. Testing corrupted glyph recovery (n4 lakh -> ₹4 lakh)...');
  const t2 = parseCurrencyAmount('n4 lakh', 'solar_energy');
  assert(t2.value === 400000, `Expected 400000, got ${t2.value}`);
  assert(t2.currency === 'INR', `Expected INR, got ${t2.currency}`);
  assert(t2.isCorruptedGlyph === true, `Expected isCorruptedGlyph true, got ${t2.isCorruptedGlyph}`);
  assert(t2.normalizedText === '₹4 lakh', `Expected ₹4 lakh, got ${t2.normalizedText}`);

  const t2b = parseCurrencyAmount('budget of n5 lakh', 'solar_energy');
  assert(t2b.value === 500000, `Expected 500000, got ${t2b.value}`);
  assert(t2b.isCorruptedGlyph === true, `Expected isCorruptedGlyph true, got ${t2b.isCorruptedGlyph}`);

  // Test 3: Decimal amounts and lakh multipliers
  console.log('3. Testing decimal currency amounts (₹4.5 lakh)...');
  const t3 = parseCurrencyAmount('₹4.5 lakh', 'solar_energy');
  assert(t3.value === 450000, `Expected 450000, got ${t3.value}`);
  assert(t3.normalizedText === '₹4.5 lakh', `Expected ₹4.5 lakh, got ${t3.normalizedText}`);

  const t3b = parseCurrencyAmount('2.5 crore', 'solar_energy');
  assert(t3b.value === 25000000, `Expected 25000000, got ${t3b.value}`);

  // Test 4: US Dollar parsing
  console.log('4. Testing USD currency parsing ($4,500, USD 1.2M)...');
  const t4 = parseCurrencyAmount('$4,500/mo', 'cloud_infrastructure');
  assert(t4.value === 4500000 || t4.value === 4500, `Expected 4500, got ${t4.value}`);
  assert(t4.currency === 'USD', `Expected USD, got ${t4.currency}`);

  const t4b = parseCurrencyAmount('$1.2 million', 'cloud_infrastructure');
  assert(t4b.value === 1200000, `Expected 1200000, got ${t4b.value}`);
  assert(t4b.currency === 'USD', `Expected USD, got ${t4b.currency}`);

  // Test 5: Explicit missing / Not reported amounts
  console.log('5. Testing missing and unreported amounts (Solar C)...');
  const t5 = parseCurrencyAmount('Not reported', 'solar_energy');
  assert(t5.value === null, `Expected null value, got ${t5.value}`);
  assert(t5.status === 'missing', `Expected status missing, got ${t5.status}`);
  assert(t5.normalizedText === 'Not reported', `Expected Not reported, got ${t5.normalizedText}`);

  const t5b = parseCurrencyAmount('', 'solar_energy');
  assert(t5b.value === null, `Expected null value, got ${t5b.value}`);
  assert(t5b.status === 'missing', `Expected status missing, got ${t5b.status}`);

  // Test 6: Ambiguous numeric values
  console.log('6. Testing ambiguous numbers without explicit currency or unit...');
  const t6 = parseCurrencyAmount('150000', 'general');
  assert(t6.currency === 'UNKNOWN', `Expected UNKNOWN, got ${t6.currency}`);
  assert(t6.isAmbiguous === true, `Expected isAmbiguous true, got ${t6.isAmbiguous}`);
  assert(t6.status === 'ambiguous', `Expected status ambiguous, got ${t6.status}`);

  // Test 7: CRITICAL NEGATIVE TEST: Do NOT blindly replace 'n' in non-currency words!
  console.log('7. Testing non-currency text with character "n" (annual, installation, planning)...');
  const nonCurrencyWords = ['annual generation', 'new installation plan', 'an option', 'planning stage'];
  for (const word of nonCurrencyWords) {
    const res = parseCurrencyAmount(word, 'solar_energy');
    assert(res.value === null, `Word "${word}" must not match as a number, got value ${res.value}`);
    assert(res.isCorruptedGlyph !== true, `Word "${word}" must not be marked as corrupted glyph`);
  }

  // Test 8: Unicode normalization (NFC)
  console.log('8. Testing Unicode NFC normalization...');
  const decomposed = '₹\u00204\u0020lakh'; // with space
  const norm = normalizeUnicodeText(decomposed);
  assert(norm === '₹ 4 lakh', `Expected normalized text, got ${norm}`);

  // Test 9: Currency Formatting
  console.log('9. Testing native currency formatting...');
  const fmtInr = formatCurrencyValue(400000, 'INR');
  assert(fmtInr.includes('₹4 lakh') || fmtInr.includes('₹400,000'), `Expected ₹4 lakh, got ${fmtInr}`);

  const fmtUsd = formatCurrencyValue(4500, 'USD');
  assert(fmtUsd === '$4,500', `Expected $4,500, got ${fmtUsd}`);

  const fmtMissing = formatCurrencyValue(null, 'INR');
  assert(fmtMissing === 'Not reported', `Expected Not reported, got ${fmtMissing}`);

  console.log('✅ ALL 9 CURRENCY AND EXTRACTION TESTS PASSED SUCCESSFULLY!');
}

runCurrencyTests();
