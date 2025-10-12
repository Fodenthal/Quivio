type NumericSource =
  | "integer"
  | "decimal"
  | "fraction"
  | "percent"
  | "scientific"
  | "word-integer"
  | "word-decimal"
  | "word-fraction";

export interface ParsedNumericAnswer {
  raw: string;
  normalized: string;
  value: number;
  decimals: number | null;
  source: NumericSource;
  tolerance: number;
}

interface NormalizedInput {
  raw: string;
  text: string;
  sign: 1 | -1;
  percent: boolean;
}

interface ParseResult {
  value: number;
  decimals: number | null;
  source: NumericSource;
}

const RELATIVE_TOLERANCE = 1e-3; // 0.1%
const MIN_ABSOLUTE_TOLERANCE = 1e-9;
const FRACTION_DECIMAL_PLACES = 6;

const NEGATIVE_WORDS = new Set(["negative", "minus"]);
const POSITIVE_WORDS = new Set(["positive", "plus"]);
const APPROX_WORDS = new Set([
  "approximately",
  "approx",
  "approximate",
  "around",
  "about",
  "roughly",
  "almost",
  "nearly",
]);
const LEADING_FILLERS = new Set(["the", "a", "an", "exactly", "precisely", "equals", "equal", "is"]);

const PASSIVE_SUFFIXES = new Set([
  "second",
  "seconds",
  "sec",
  "s",
  "millisecond",
  "milliseconds",
  "ms",
  "minute",
  "minutes",
  "min",
  "hour",
  "hours",
  "hr",
  "hrs",
  "day",
  "days",
  "week",
  "weeks",
  "month",
  "months",
  "year",
  "years",
  "meter",
  "meters",
  "metre",
  "metres",
  "m",
  "cm",
  "mm",
  "km",
  "kilometer",
  "kilometers",
  "kilometre",
  "kilometres",
  "gram",
  "grams",
  "g",
  "kg",
  "kilogram",
  "kilograms",
  "pound",
  "pounds",
  "lb",
  "lbs",
  "ounce",
  "ounces",
  "oz",
  "dollar",
  "dollars",
  "usd",
  "eur",
  "yen",
  "cent",
  "cents",
  "mph",
  "kph",
  "ft",
  "foot",
  "feet",
  "inch",
  "inches",
  "mile",
  "miles",
  "hz",
  "khz",
  "mhz",
  "ghz",
  "watt",
  "watts",
  "joule",
  "joules",
  "amp",
  "amps",
  "ampere",
  "amperes",
  "ohm",
  "ohms",
  "kelvin",
  "kelvins",
  "degree",
  "degrees",
]);

const DIGIT_WORDS: Record<string, number> = {
  zero: 0,
  oh: 0,
  o: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

const TEEN_WORDS: Record<string, number> = {
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS_WORDS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const MAGNITUDE_WORDS: Record<string, number> = {
  hundred: 100,
  thousand: 1_000,
  million: 1_000_000,
  billion: 1_000_000_000,
};

const ORDINAL_WORDS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  eleventh: 11,
  twelfth: 12,
  thirteenth: 13,
  fourteenth: 14,
  fifteenth: 15,
  sixteenth: 16,
  seventeenth: 17,
  eighteenth: 18,
  nineteenth: 19,
  twentieth: 20,
  thirtieth: 30,
  fortieth: 40,
  fiftieth: 50,
  sixtieth: 60,
  seventieth: 70,
  eightieth: 80,
  ninetieth: 90,
  hundredth: 100,
  thousandth: 1_000,
};

const FRACTION_DENOMINATOR_WORDS: Record<string, number> = {
  half: 2,
  halves: 2,
  third: 3,
  thirds: 3,
  fourth: 4,
  fourths: 4,
  quarter: 4,
  quarters: 4,
  fifth: 5,
  fifths: 5,
  sixth: 6,
  sixths: 6,
  seventh: 7,
  sevenths: 7,
  eighth: 8,
  eighths: 8,
  ninth: 9,
  ninths: 9,
  tenth: 10,
  tenths: 10,
  eleventh: 11,
  twelfth: 12,
  thirteenth: 13,
  fourteenth: 14,
  fifteenth: 15,
  sixteenth: 16,
  seventeenth: 17,
  eighteenth: 18,
  nineteenth: 19,
  twentieth: 20,
  twentieths: 20,
  hundredth: 100,
  hundredths: 100,
};

function normalizeInput(raw: string): NormalizedInput | null {
  if (typeof raw !== "string") return null;
  let text = raw
    .replace(/\u2212/g, "-")
    .replace(/per\s+cent/gi, "percent")
    .toLowerCase()
    .trim();

  if (!text) return null;

  text = text.replace(/[^0-9a-z./%+\-\s×^*]/g, " ");
  text = text.replace(/\s+/g, " ").trim();

  let tokens = text.split(" ").filter(Boolean);
  if (tokens.length === 0) return null;

  let sign: 1 | -1 = 1;

  // Explicit + / - tokens at the start
  if (tokens[0] === "-" || tokens[0] === "+") {
    if (tokens[0] === "-") sign = -1;
    tokens = tokens.slice(1);
  }

  while (tokens.length > 0 && NEGATIVE_WORDS.has(tokens[0])) {
    sign = -1;
    tokens.shift();
  }

  while (tokens.length > 0 && POSITIVE_WORDS.has(tokens[0])) {
    sign = 1;
    tokens.shift();
  }

  while (tokens.length > 0 && LEADING_FILLERS.has(tokens[0])) {
    tokens.shift();
  }

  if (tokens.length === 0) return null;

  tokens = tokens.filter(token => !APPROX_WORDS.has(token));

  tokens = tokens.flatMap(token => {
    if (/^[a-z]+-[a-z]+$/.test(token)) {
      return token.split("-");
    }
    return [token];
  });

  if (tokens.length === 0) return null;

  let percent = false;

  const lastToken = tokens[tokens.length - 1];
  if (lastToken && lastToken.includes("%")) {
    percent = true;
    const cleaned = lastToken.replace(/%/g, "");
    if (cleaned) {
      tokens[tokens.length - 1] = cleaned;
    } else {
      tokens.pop();
    }
  }

  if (tokens.length > 0) {
    const trailing = tokens[tokens.length - 1];
    if (trailing === "percent" || trailing === "percentage") {
      percent = true;
      tokens.pop();
    }
  }

  while (tokens.length > 1 && PASSIVE_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  if (tokens[tokens.length - 1] === "per") {
    tokens.pop();
  }

  if (tokens.length === 0) return null;

  const normalized = tokens.join(" ");
  return { raw, text: normalized, sign, percent };
}

function countDecimalPlaces(text: string): number {
  const parts = text.split(".");
  if (parts.length !== 2) {
    return 0;
  }
  return parts[1].length;
}

function parseStandardNumber(input: NormalizedInput): ParseResult | null {
  const normalized = input.text.replace(/,/g, "");
  if (!normalized) return null;

  const compact = normalized.replace(/\s+/g, "");
  if (!compact) return null;

  if (!/^\d*(?:\.\d+)?(?:e[-+]?\d+)?$/.test(compact)) {
    return null;
  }

  const value = Number(compact);
  if (!Number.isFinite(value)) {
    return null;
  }

  const decimals = compact.includes(".") ? countDecimalPlaces(compact) : 0;
  return {
    value,
    decimals,
    source: decimals > 0 ? "decimal" : "integer",
  };
}

function parseScientific(input: NormalizedInput): ParseResult | null {
  let normalized = input.text.replace(/×/g, "x").replace(/·/g, "x");
  normalized = normalized.replace(/\s*/g, "");

  if (!normalized) return null;

  if (/^\d*(?:\.\d+)?e[-+]?\d+$/i.test(normalized)) {
    const value = Number(normalized);
    if (!Number.isFinite(value)) return null;
    const basePart = normalized.split("e")[0];
    const decimals = basePart.includes(".") ? countDecimalPlaces(basePart) : 0;
    return { value, decimals, source: "scientific" };
  }

  const match = normalized.match(/^(\d*(?:\.\d+)?)[x*]10\^([-+]?\d+)$/i);
  if (match) {
    const base = Number(match[1]);
    const exponent = Number(match[2]);
    if (!Number.isFinite(base) || !Number.isFinite(exponent)) return null;
    const value = base * Math.pow(10, exponent);
    const decimals = match[1].includes(".") ? countDecimalPlaces(match[1]) : 0;
    return { value, decimals, source: "scientific" };
  }

  return null;
}

function parseFractionDigits(input: NormalizedInput): ParseResult | null {
  const text = input.text;
  const simple = text.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (simple) {
    const numerator = Number(simple[1]);
    const denominator = Number(simple[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
    return {
      value: numerator / denominator,
      decimals: FRACTION_DECIMAL_PLACES,
      source: "fraction",
    };
  }

  const mixed = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (!Number.isFinite(whole) || !Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return null;
    }
    return {
      value: whole + numerator / denominator,
      decimals: FRACTION_DECIMAL_PLACES,
      source: "fraction",
    };
  }

  const overMatch = text.match(/^(\d+)\s+over\s+(\d+)$/);
  if (overMatch) {
    const numerator = Number(overMatch[1]);
    const denominator = Number(overMatch[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
    return {
      value: numerator / denominator,
      decimals: FRACTION_DECIMAL_PLACES,
      source: "fraction",
    };
  }

  return null;
}

function parseIntegerWordTokens(tokens: string[], allowOrdinal = false): number | null {
  if (tokens.length === 0) return null;
  let total = 0;
  let current = 0;
  let seen = false;

  for (const token of tokens) {
    if (!token) continue;
    if (token === "and") continue;
    if (token === "a" || token === "an") {
      current += 1;
      seen = true;
      continue;
    }
    if (DIGIT_WORDS[token] !== undefined) {
      current += DIGIT_WORDS[token];
      seen = true;
      continue;
    }
    if (TEEN_WORDS[token] !== undefined) {
      current += TEEN_WORDS[token];
      seen = true;
      continue;
    }
    if (TENS_WORDS[token] !== undefined) {
      current += TENS_WORDS[token];
      seen = true;
      continue;
    }
    if (token === "hundred") {
      if (current === 0) {
        current = 1;
      }
      current *= 100;
      seen = true;
      continue;
    }
    if (MAGNITUDE_WORDS[token] !== undefined) {
      if (current === 0) {
        current = 1;
      }
      total += current * MAGNITUDE_WORDS[token];
      current = 0;
      seen = true;
      continue;
    }
    if (allowOrdinal && ORDINAL_WORDS[token] !== undefined) {
      current += ORDINAL_WORDS[token];
      seen = true;
      continue;
    }
    if (allowOrdinal) {
      const stripped = token.replace(/(?:st|nd|rd|th)$/g, "");
      if (ORDINAL_WORDS[stripped] !== undefined) {
        current += ORDINAL_WORDS[stripped];
        seen = true;
        continue;
      }
    }
    return null;
  }

  if (!seen) return null;
  return total + current;
}

function parseDenominatorTokens(tokens: string[]): number | null {
  if (tokens.length === 0) return null;
  const mappedTokens = tokens.map(token => token.replace(/s$/, ""));
  for (const token of mappedTokens.reverse()) {
    const key = token.replace(/(?:st|nd|rd|th)$/g, "");
    if (FRACTION_DENOMINATOR_WORDS[key] !== undefined) {
      return FRACTION_DENOMINATOR_WORDS[key];
    }
    if (ORDINAL_WORDS[key] !== undefined) {
      return ORDINAL_WORDS[key];
    }
  }
  return parseIntegerWordTokens(tokens, true);
}

function parseWordFraction(tokens: string[]): ParseResult | null {
  if (tokens.length === 0) return null;
  if (tokens.includes("and")) {
    return null;
  }
  const overIndex = tokens.indexOf("over");
  if (overIndex > 0 && overIndex < tokens.length - 1) {
    const numeratorTokens = tokens.slice(0, overIndex);
    const denominatorTokens = tokens.slice(overIndex + 1);
    const numerator = parseIntegerWordTokens(numeratorTokens, true);
    const denominator = parseDenominatorTokens(denominatorTokens);
    if (numerator === null || denominator === null || denominator === 0) return null;
    return {
      value: numerator / denominator,
      decimals: FRACTION_DECIMAL_PLACES,
      source: "word-fraction",
    };
  }

  const denomToken = tokens[tokens.length - 1];
  const denominator = FRACTION_DENOMINATOR_WORDS[denomToken] ?? FRACTION_DENOMINATOR_WORDS[denomToken.replace(/s$/, "")];
  if (denominator !== undefined) {
    const numeratorTokens = tokens.slice(0, -1).filter(token => token !== "of");
    const numerator = numeratorTokens.length === 0 ? 1 : parseIntegerWordTokens(numeratorTokens, true);
    if (numerator === null || denominator === 0) return null;
    return {
      value: numerator / denominator,
      decimals: FRACTION_DECIMAL_PLACES,
      source: "word-fraction",
    };
  }

  return null;
}

function parseDecimalWordTokens(tokens: string[]): string | null {
  if (tokens.length === 0) return null;
  const digits: string[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token || token === "and") continue;
    if (DIGIT_WORDS[token] !== undefined) {
      digits.push(String(DIGIT_WORDS[token]));
      continue;
    }
    if (TEEN_WORDS[token] !== undefined) {
      digits.push(String(TEEN_WORDS[token]).padStart(2, "0"));
      continue;
    }
    if (TENS_WORDS[token] !== undefined) {
      let value = TENS_WORDS[token];
      if (i + 1 < tokens.length && DIGIT_WORDS[tokens[i + 1]] !== undefined) {
        value += DIGIT_WORDS[tokens[i + 1]];
        i += 1;
      }
      digits.push(String(value).padStart(2, "0"));
      continue;
    }
    return null;
  }
  if (digits.length === 0) return null;
  return digits.join("");
}

function parseWordNumber(input: NormalizedInput): ParseResult | null {
  const tokens = input.text.split(" ").filter(Boolean);
  if (tokens.length === 0) return null;

  const fraction = parseWordFraction(tokens);
  if (fraction) return fraction;

  const pointIndex = tokens.indexOf("point");
  if (pointIndex !== -1) {
    const integerTokens = tokens.slice(0, pointIndex);
    const decimalTokens = tokens.slice(pointIndex + 1);
    const integerValue = integerTokens.length === 0 ? 0 : parseIntegerWordTokens(integerTokens, false);
    if (integerValue === null) return null;
    const decimalDigits = parseDecimalWordTokens(decimalTokens);
    if (!decimalDigits) return null;
    const decimals = decimalDigits.length;
    const value = integerValue + Number(`0.${decimalDigits}`);
    return { value, decimals, source: "word-decimal" };
  }

  const mixedIndex = tokens.findIndex(token => token === "and");
  if (mixedIndex > 0 && mixedIndex < tokens.length - 1) {
    const after = tokens.slice(mixedIndex + 1);
    if (after.some(token => FRACTION_DENOMINATOR_WORDS[token] !== undefined)) {
      const integerTokens = tokens.slice(0, mixedIndex);
      const fractionTokens = tokens.slice(mixedIndex + 1);
      const integerValue = parseIntegerWordTokens(integerTokens, false);
      const fractionValue = parseWordFraction(fractionTokens);
      if (integerValue !== null && fractionValue) {
        return {
          value: integerValue + fractionValue.value,
          decimals: FRACTION_DECIMAL_PLACES,
          source: "word-fraction",
        };
      }
    }
  }

  const integerValue = parseIntegerWordTokens(tokens, true);
  if (integerValue !== null) {
    return {
      value: integerValue,
      decimals: 0,
      source: "word-integer",
    };
  }

  return null;
}

function computeTolerance(value: number, decimals: number | null): number {
  let decimalTolerance: number;
  if (decimals === null) {
    decimalTolerance = Number.POSITIVE_INFINITY;
  } else if (decimals === 0) {
    decimalTolerance = 0;
  } else {
    decimalTolerance = 0.5 * Math.pow(10, -decimals);
  }

  const relativeTolerance = Math.abs(value) > 0 ? Math.abs(value) * RELATIVE_TOLERANCE : 0;

  let tolerance = decimalTolerance;
  if (!Number.isFinite(tolerance)) {
    tolerance = relativeTolerance;
  } else if (relativeTolerance > 0) {
    tolerance = Math.min(tolerance, relativeTolerance);
  }

  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    tolerance = relativeTolerance || MIN_ABSOLUTE_TOLERANCE;
  }

  return Math.max(tolerance, MIN_ABSOLUTE_TOLERANCE);
}

function finalizeResult(normalized: NormalizedInput, result: ParseResult): ParsedNumericAnswer {
  let { value, decimals, source } = result;
  value *= normalized.sign;

  if (normalized.percent) {
    value /= 100;
    if (decimals === null) {
      decimals = 2;
    } else {
      decimals = Math.max(decimals + 2, 2);
    }
    source = "percent";
  }

  const tolerance = computeTolerance(value, decimals);

  return {
    raw: normalized.raw,
    normalized: normalized.text,
    value,
    decimals,
    source,
    tolerance,
  };
}

export function parseNumericAnswer(raw: string): ParsedNumericAnswer | null {
  const normalized = normalizeInput(raw);
  if (!normalized) return null;

  const parsers: Array<(input: NormalizedInput) => ParseResult | null> = [
    parseStandardNumber,
    parseScientific,
    parseFractionDigits,
    parseWordNumber,
  ];

  for (const parser of parsers) {
    const result = parser(normalized);
    if (result) {
      return finalizeResult(normalized, result);
    }
  }

  return null;
}

export function compareNumericAnswers(user: ParsedNumericAnswer, target: ParsedNumericAnswer): boolean {
  const difference = Math.abs(user.value - target.value);
  const tolerance = Math.max(user.tolerance, target.tolerance);
  if (difference <= tolerance) {
    return true;
  }

  const reference = Math.max(Math.abs(user.value), Math.abs(target.value), 1);
  const relativeDifference = difference / reference;
  return relativeDifference <= RELATIVE_TOLERANCE && difference <= Math.max(tolerance, MIN_ABSOLUTE_TOLERANCE);
}
