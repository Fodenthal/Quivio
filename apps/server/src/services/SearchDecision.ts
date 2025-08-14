/**
 * Robust search decision heuristics for trivia topic handling.
 *
 * Default policy: search unless we can confidently skip.
 * Skip only for clearly broad/generic or computational/puzzle prompts.
 *
 * Exported as named functions per project conventions.
 */

export interface SearchDecision {
  skip: boolean;
  reason: string;
}

/**
 * Determine whether Stage 1 search can be safely skipped for a topic.
 * The function returns a structured decision with an explicit reason string for logging.
 *
 * @param topic - Raw user topic
 * @returns {SearchDecision} - skip flag and reason
 */
export function shouldSkipSearch(topic: string): SearchDecision {
  const raw = topic ?? '';
  const t = raw.trim();
  const lower = t.toLowerCase();

  if (!t) {
    return { skip: true, reason: 'empty-topic' };
  }

  // Force-search overrides: if any of these match, we should NOT skip search
  if (hasAcronymWithDigits(t)) {
    return { skip: false, reason: 'acronym+digits' };
  }
  if (hasYear(lower)) {
    return { skip: false, reason: 'contains-year' };
  }
  if (hasRomanNumerals(t)) {
    return { skip: false, reason: 'roman-numerals' };
  }
  if (hasEpisodeOrSeasonWithDigits(lower)) {
    return { skip: false, reason: 'episode-or-season+digits' };
  }
  if (containsEntityPhrase(lower)) {
    return { skip: false, reason: 'entity-phrase' };
  }

  // Ultra-short noise (1-2 letters, no digits)
  if (/^[A-Za-z]{1,2}$/.test(t)) {
    return { skip: true, reason: 'too-short' };
  }

  if (isComputationalOrPuzzle(lower)) {
    return { skip: true, reason: 'computational-or-puzzle' };
  }

  if (isBroadDomain(lower)) {
    return { skip: true, reason: 'broad-domain' };
  }

  // Default: do NOT skip search
  return { skip: false, reason: 'default-search' };
}

// ————— Helpers —————

function hasYear(lower: string): boolean {
  return /\b(?:19|20)\d{2}\b/.test(lower);
}

function hasAcronymWithDigits(text: string): boolean {
  return /\b[A-Z]{2,}\s*\d+\b/.test(text);
}

function hasRomanNumerals(text: string): boolean {
  // Require at least two roman numeral chars to avoid matching pronoun "I"
  return /\b[MDCLXVI]{2,}\b/i.test(text);
}

function hasEpisodeOrSeasonWithDigits(lower: string): boolean {
  return /\b(?:ep|episode|season|s|e)\s*\d+\b/.test(lower);
}

function containsEntityPhrase(lower: string): boolean {
  const phrases = [
    'ufc', 'super bowl', 'world series', 'stanley cup', 'tour de france', 'grand prix',
    'masters', 'open', 'mls', 'ncaa', "ballon d'or", 'grammys', 'oscars', 'emmys',
    'premier league', 'champions league', 'fifa', 'uefa', 'nobel', 'world cup',
    'formula 1', 'f1'
  ];
  return phrases.some(p => lower.includes(p));
}

function isComputationalOrPuzzle(lower: string): boolean {
  const keywords = [
    'expected value', 'permutation', 'combination', 'solve', 'derivative', 'integral',
    'probability of', 'riddle', 'puzzle', 'logic puzzle', 'emoji', 'flags',
    'compute', 'calculate', 'show that', 'prove that'
  ];
  return keywords.some(k => lower.includes(k));
}

function isBroadDomain(lower: string): boolean {
  const broadDomains = [
    'geography','mathematics','math','algebra','geometry','calculus','statistics','probability',
    'physics','chemistry','biology','history','literature','sports','sport','film','movies','music',
    'art','finance','economics','computer science','programming','coding','philosophy','geology',
    'botany','zoology','astronomy','grammar','vocabulary','language','politics','law','medicine',
    'anatomy','psychology','sociology'
  ];
  return broadDomains.includes(lower);
}


