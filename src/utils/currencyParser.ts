/**
 * THINKORA — Robust Currency & Numerical Extraction Utility
 * Handles Unicode preservation, glyph corruption recovery (e.g. PDF font encoding artifacts),
 * multi-currency parsing (INR, USD, EUR), and unit multipliers (Lakh, Crore, Thousand).
 */

export interface ParsedCurrencyAmount {
  rawText: string;
  normalizedText: string;
  value: number | null;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'UNKNOWN';
  currencySymbol: string;
  unitMultiplier?: 'lakh' | 'crore' | 'thousand' | 'million';
  isCorruptedGlyph?: boolean;
  isAmbiguous?: boolean;
  status: 'verified' | 'unverified' | 'missing' | 'ambiguous';
  confidence: number;
}

/**
 * Normalizes input text using Unicode NFC without altering non-whitespace semantics
 */
export function normalizeUnicodeText(input: string): string {
  if (!input) return '';
  return input.normalize('NFC').trim();
}

/**
 * Parse an expression into a structured currency amount
 */
export function parseCurrencyAmount(rawSnippet: string, domainContext?: 'solar_energy' | 'cloud_infrastructure' | 'general'): ParsedCurrencyAmount {
  if (!rawSnippet || typeof rawSnippet !== 'string') {
    return {
      rawText: '',
      normalizedText: 'Not reported',
      value: null,
      currency: 'UNKNOWN',
      currencySymbol: '',
      status: 'missing',
      confidence: 0,
    };
  }

  const clean = normalizeUnicodeText(rawSnippet);

  // Check for explicit missing/unreported notices
  if (/^(not\s*reported|unknown|n\/?a|unspecified|pending|none)$/i.test(clean) || /not\s*reported/i.test(clean)) {
    return {
      rawText: clean,
      normalizedText: 'Not reported',
      value: null,
      currency: domainContext === 'solar_energy' ? 'INR' : 'UNKNOWN',
      currencySymbol: domainContext === 'solar_energy' ? '₹' : '',
      status: 'missing',
      confidence: 95,
    };
  }

  // 1. Check for standard Indian Rupee formats: ₹, Rs, INR
  const inrExplicitRegex = /(?:₹|rs\.?|inr)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|lac|crore|cr|k|thousand)?/i;
  const inrMatch = clean.match(inrExplicitRegex);

  if (inrMatch) {
    const numPart = parseFloat(inrMatch[1].replace(/,/g, ''));
    const unit = inrMatch[2]?.toLowerCase();
    let multiplier = 1;
    let unitMultiplier: ParsedCurrencyAmount['unitMultiplier'] = undefined;

    if (unit === 'lakh' || unit === 'lac') {
      multiplier = 100000;
      unitMultiplier = 'lakh';
    } else if (unit === 'crore' || unit === 'cr') {
      multiplier = 10000000;
      unitMultiplier = 'crore';
    } else if (unit === 'thousand' || unit === 'k') {
      multiplier = 1000;
      unitMultiplier = 'thousand';
    }

    const value = Math.round(numPart * multiplier);
    const normalizedText = unitMultiplier
      ? `₹${numPart} ${unitMultiplier}`
      : `₹${value.toLocaleString()}`;

    return {
      rawText: clean,
      normalizedText,
      value,
      currency: 'INR',
      currencySymbol: '₹',
      unitMultiplier,
      isCorruptedGlyph: false,
      status: 'verified',
      confidence: 98,
    };
  }

  // 2. Check for PDF font-encoding corrupted Rupee glyph:
  // In fonts lacking Unicode 6.0 U+20B9 ToUnicode CMap, '₹' maps to character code 'n'
  // CRITICAL REQUIREMENT: Do NOT blindly replace every 'n'!
  // Must strictly match 'n' immediately followed by a digit and a recognized currency unit (lakh, crore, etc.)
  // OR word boundary \bn\d+ in clean budget/cost context.
  const corruptedGlyphRegex = /(?:^|\b|\s)n\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|lac|crore|cr)?(?:\b|\s|$)/i;
  const corruptedMatch = clean.match(corruptedGlyphRegex);

  if (corruptedMatch) {
    const numPart = parseFloat(corruptedMatch[1].replace(/,/g, ''));
    const unit = corruptedMatch[2]?.toLowerCase();
    let multiplier = 1;
    let unitMultiplier: ParsedCurrencyAmount['unitMultiplier'] = undefined;

    if (unit === 'lakh' || unit === 'lac' || (!unit && domainContext === 'solar_energy' && numPart <= 50)) {
      // In Indian campus solar contexts, small integer digits like '4' or '6' in cost columns designate Lakhs
      multiplier = 100000;
      unitMultiplier = 'lakh';
    } else if (unit === 'crore' || unit === 'cr') {
      multiplier = 10000000;
      unitMultiplier = 'crore';
    }

    const value = Math.round(numPart * multiplier);
    const normalizedText = unitMultiplier ? `₹${numPart} ${unitMultiplier}` : `₹${value.toLocaleString()}`;

    return {
      rawText: clean,
      normalizedText,
      value,
      currency: 'INR',
      currencySymbol: '₹',
      unitMultiplier,
      isCorruptedGlyph: true,
      status: 'verified',
      confidence: 94,
    };
  }

  // 3. Plain Lakh / Crore without explicit symbol (e.g. "4 lakh", "6 lakh")
  const plainLakhRegex = /(?:^|\b)(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|lac|crore|cr)\b/i;
  const plainLakhMatch = clean.match(plainLakhRegex);

  if (plainLakhMatch) {
    const numPart = parseFloat(plainLakhMatch[1].replace(/,/g, ''));
    const unit = plainLakhMatch[2]?.toLowerCase();
    const multiplier = unit === 'crore' || unit === 'cr' ? 10000000 : 100000;
    const unitMultiplier = unit === 'crore' || unit === 'cr' ? 'crore' : 'lakh';
    const value = Math.round(numPart * multiplier);

    return {
      rawText: clean,
      normalizedText: `₹${numPart} ${unitMultiplier}`,
      value,
      currency: 'INR',
      currencySymbol: '₹',
      unitMultiplier,
      isCorruptedGlyph: false,
      status: 'verified',
      confidence: 95,
    };
  }

  // 4. US Dollar formats: $, USD
  const usdRegex = /(?:\$|usd)\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|million|m)?/i;
  const usdMatch = clean.match(usdRegex);

  if (usdMatch) {
    const numPart = parseFloat(usdMatch[1].replace(/,/g, ''));
    const unit = usdMatch[2]?.toLowerCase();
    let multiplier = 1;
    let unitMultiplier: ParsedCurrencyAmount['unitMultiplier'] = undefined;

    if (unit === 'k') {
      multiplier = 1000;
      unitMultiplier = 'thousand';
    } else if (unit === 'million' || unit === 'm') {
      multiplier = 1000000;
      unitMultiplier = 'million';
    }

    const value = Math.round(numPart * multiplier);
    const normalizedText = `$${value.toLocaleString()}`;

    return {
      rawText: clean,
      normalizedText,
      value,
      currency: 'USD',
      currencySymbol: '$',
      unitMultiplier,
      isCorruptedGlyph: false,
      status: 'verified',
      confidence: 98,
    };
  }

  // 5. Plain numbers with domain context
  const plainNumRegex = /^\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*$/;
  const plainNumMatch = clean.match(plainNumRegex);

  if (plainNumMatch) {
    const val = parseFloat(plainNumMatch[1].replace(/,/g, ''));
    if (domainContext === 'solar_energy') {
      // In solar, if number < 100 it's likely Lakhs (e.g. 4 -> 4 Lakh), otherwise raw INR
      const isLakh = val < 100;
      const finalVal = isLakh ? val * 100000 : val;
      return {
        rawText: clean,
        normalizedText: isLakh ? `₹${val} lakh` : `₹${finalVal.toLocaleString()}`,
        value: finalVal,
        currency: 'INR',
        currencySymbol: '₹',
        unitMultiplier: isLakh ? 'lakh' : undefined,
        isAmbiguous: true,
        status: 'unverified',
        confidence: 70,
      };
    }

    if (domainContext === 'cloud_infrastructure') {
      return {
        rawText: clean,
        normalizedText: `$${val.toLocaleString()}`,
        value: val,
        currency: 'USD',
        currencySymbol: '$',
        isAmbiguous: true,
        status: 'unverified',
        confidence: 75,
      };
    }

    return {
      rawText: clean,
      normalizedText: val.toLocaleString(),
      value: val,
      currency: 'UNKNOWN',
      currencySymbol: '',
      isAmbiguous: true,
      status: 'ambiguous',
      confidence: 50,
    };
  }

  // Fallback for unparseable or ambiguous snippets
  return {
    rawText: clean,
    normalizedText: clean,
    value: null,
    currency: 'UNKNOWN',
    currencySymbol: '',
    isAmbiguous: true,
    status: 'ambiguous',
    confidence: 30,
  };
}

/**
 * Formats a currency value cleanly in its native currency
 */
export function formatCurrencyValue(amount: number | null | undefined, currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'UNKNOWN' = 'USD'): string {
  if (amount === null || amount === undefined) {
    return 'Not reported';
  }

  if (currency === 'INR') {
    if (amount >= 100000) {
      const lakhs = (amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1);
      return `₹${lakhs} lakh (₹${amount.toLocaleString()})`;
    }
    return `₹${amount.toLocaleString()}`;
  }

  if (currency === 'USD') {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${amount.toLocaleString()}`;
    }
    return `$${amount}`;
  }

  return amount.toLocaleString();
}
