/**
 * Currency formatting utilities for consistent amount display
 * Handles integer amounts to avoid floating point precision issues
 */

export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  showSymbol?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Formats an amount as currency, ensuring integer handling to avoid precision issues
 */
export function formatCurrency(
  amount: number | string,
  options: CurrencyFormatOptions = {},
): string {
  const {
    currency = "PKR",
    locale = "en-US",
    showSymbol = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  // Parse and ensure integer to avoid floating point issues
  let numericAmount: number;
  if (typeof amount === "string") {
    numericAmount = parseFloat(amount);
  } else {
    numericAmount = amount;
  }

  // Round to avoid floating point precision issues
  numericAmount = Math.round(numericAmount);

  if (isNaN(numericAmount)) {
    return showSymbol ? `${currency} 0` : "0";
  }

  // Format the number with proper separators
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericAmount);

  return showSymbol ? `${currency} ${formattedNumber}` : formattedNumber;
}

/**
 * Formats an amount specifically for PKR display
 */
export function formatPKR(amount: number | string): string {
  return formatCurrency(amount, { currency: "PKR" });
}

/**
 * Formats an amount without currency symbol
 */
export function formatAmount(amount: number | string): string {
  return formatCurrency(amount, { showSymbol: false });
}

/**
 * Parses a currency string back to number (integer)
 */
export function parseCurrencyAmount(currencyString: string): number {
  // Remove currency symbols and spaces, keep only digits
  const cleanString = currencyString.replace(/[^\d]/g, "");
  const amount = parseInt(cleanString, 10);
  return isNaN(amount) ? 0 : amount;
}

/**
 * Validates if an amount is valid for currency operations
 */
export function isValidCurrencyAmount(
  amount: number | string,
  options: {
    minAmount?: number;
    maxAmount?: number;
    allowZero?: boolean;
  } = {},
): { valid: boolean; error?: string } {
  const { minAmount = 1, maxAmount = 10000000, allowZero = false } = options;

  let numericAmount: number;
  if (typeof amount === "string") {
    // Remove non-numeric characters and parse
    const cleanAmount = amount.replace(/[^\d]/g, "");
    numericAmount = parseInt(cleanAmount, 10);
  } else {
    numericAmount = Math.round(amount);
  }

  if (isNaN(numericAmount)) {
    return { valid: false, error: "Invalid amount format" };
  }

  if (!allowZero && numericAmount <= 0) {
    return { valid: false, error: "Amount must be greater than zero" };
  }

  if (allowZero && numericAmount < 0) {
    return { valid: false, error: "Amount cannot be negative" };
  }

  if (numericAmount < minAmount) {
    return {
      valid: false,
      error: `Amount must be at least ${formatPKR(minAmount)}`,
    };
  }

  if (numericAmount > maxAmount) {
    return {
      valid: false,
      error: `Amount cannot exceed ${formatPKR(maxAmount)}`,
    };
  }

  return { valid: true };
}

/**
 * Calculates percentage bonus and returns formatted result
 */
export function calculateBonus(
  amount: number | string,
  percentage: number,
): {
  originalAmount: number;
  bonusAmount: number;
  totalAmount: number;
  formattedOriginal: string;
  formattedBonus: string;
  formattedTotal: string;
} {
  const originalAmount = Math.round(
    typeof amount === "string" ? parseFloat(amount) : amount,
  );
  const bonusAmount = Math.round(originalAmount * (percentage / 100));
  const totalAmount = originalAmount + bonusAmount;

  return {
    originalAmount,
    bonusAmount,
    totalAmount,
    formattedOriginal: formatPKR(originalAmount),
    formattedBonus: formatPKR(bonusAmount),
    formattedTotal: formatPKR(totalAmount),
  };
}

/**
 * Formats exchange rate display
 */
export function formatExchangeRate(
  rate: number,
  fromCurrency: string = "USDT",
  toCurrency: string = "PKR",
): string {
  const roundedRate = Math.round(rate);
  return `1 ${fromCurrency} = ${formatPKR(roundedRate)}`;
}

/**
 * Converts USDT to PKR using provided rate
 */
export function convertUsdtToPkr(
  usdtAmount: number,
  rate: number,
): {
  usdtAmount: number;
  pkrAmount: number;
  rate: number;
  formattedPkr: string;
  formattedRate: string;
} {
  const roundedRate = Math.round(rate);
  const pkrAmount = Math.round(usdtAmount * roundedRate);

  return {
    usdtAmount,
    pkrAmount,
    rate: roundedRate,
    formattedPkr: formatPKR(pkrAmount),
    formattedRate: formatExchangeRate(roundedRate),
  };
}

/**
 * Sanitizes user input for amount fields
 */
export function sanitizeAmountInput(input: string): string {
  // Remove all non-numeric characters
  return input.replace(/[^\d]/g, "");
}

/**
 * Formats amount for display in input fields
 */
export function formatAmountForInput(amount: number | string): string {
  if (!amount) return "";

  const numericAmount =
    typeof amount === "string" ? parseInt(amount, 10) : Math.round(amount);
  return isNaN(numericAmount) ? "" : numericAmount.toString();
}

/**
 * Test cases for currency formatting utilities
 * These ensure proper handling of edge cases and precision issues
 */
export function testCurrencyUtils(): {
  passed: number;
  failed: number;
  results: Array<{
    test: string;
    passed: boolean;
    expected: string;
    actual: string;
  }>;
} {
  const tests = [
    // Basic formatting tests
    { input: 20000, expected: "PKR 20,000", test: "Format 20000 as PKR" },
    { input: 19999, expected: "PKR 19,999", test: "Format 19999 as PKR" },
    { input: 2000, expected: "PKR 2,000", test: "Format 2000 as PKR" },
    { input: 1999, expected: "PKR 1,999", test: "Format 1999 as PKR" },

    // String input tests
    {
      input: "20000",
      expected: "PKR 20,000",
      test: "Format string '20000' as PKR",
    },
    {
      input: "19999.99",
      expected: "PKR 20,000",
      test: "Format string '19999.99' as PKR (should round)",
    },

    // Float precision tests (these should be rounded to integers)
    {
      input: 19999.9,
      expected: "PKR 20,000",
      test: "Format 19999.9 as PKR (should round up)",
    },
    {
      input: 19999.1,
      expected: "PKR 19,999",
      test: "Format 19999.1 as PKR (should round down)",
    },
    {
      input: 20000.4,
      expected: "PKR 20,000",
      test: "Format 20000.4 as PKR (should round down)",
    },
    {
      input: 20000.6,
      expected: "PKR 20,001",
      test: "Format 20000.6 as PKR (should round up)",
    },

    // Edge cases
    { input: 0, expected: "PKR 0", test: "Format 0 as PKR" },
    { input: 1, expected: "PKR 1", test: "Format 1 as PKR" },
    {
      input: 1000000,
      expected: "PKR 1,000,000",
      test: "Format 1000000 as PKR",
    },
  ];

  const results: Array<{
    test: string;
    passed: boolean;
    expected: string;
    actual: string;
  }> = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of tests) {
    const actual = formatPKR(testCase.input);
    const testPassed = actual === testCase.expected;

    results.push({
      test: testCase.test,
      passed: testPassed,
      expected: testCase.expected,
      actual,
    });

    if (testPassed) {
      passed++;
    } else {
      failed++;
    }
  }

  return { passed, failed, results };
}

/**
 * Run validation tests
 */
export function testCurrencyValidation(): {
  passed: number;
  failed: number;
  results: Array<{
    test: string;
    passed: boolean;
    expected: boolean;
    actual: boolean;
  }>;
} {
  const tests = [
    { input: 100, expected: true, test: "Valid amount 100" },
    { input: "100", expected: true, test: "Valid string amount '100'" },
    { input: 99, expected: false, test: "Invalid amount 99 (below minimum)" },
    { input: 0, expected: false, test: "Invalid amount 0" },
    { input: -100, expected: false, test: "Invalid negative amount" },
    { input: 1000001, expected: false, test: "Invalid amount above maximum" },
    { input: "abc", expected: false, test: "Invalid string 'abc'" },
    { input: "", expected: false, test: "Invalid empty string" },
  ];

  const results: Array<{
    test: string;
    passed: boolean;
    expected: boolean;
    actual: boolean;
  }> = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of tests) {
    const validation = isValidCurrencyAmount(testCase.input, {
      minAmount: 100,
      maxAmount: 1000000,
      allowZero: false,
    });
    const actual = validation.valid;
    const testPassed = actual === testCase.expected;

    results.push({
      test: testCase.test,
      passed: testPassed,
      expected: testCase.expected,
      actual,
    });

    if (testPassed) {
      passed++;
    } else {
      failed++;
    }
  }

  return { passed, failed, results };
}
