# Trivia Answer Matcher (Medium, Typo‑Strict)

## 1. What “Medium, Typo‑Strict” Means

**Included**

* Case‑folding, whitespace trimming, punctuation stripping  
* Stop‑word removal (`the`, `a`, `an`, `of`, `on`, `in`, `for`, `to`, `and`, `or`, `with`, `is`, `are`, `was`, `were`)  
* Order‑agnostic token comparison (token‑set / token‑sort)  
* **Smart punctuation handling** for abbreviations (preserve periods in "U.S.A.")

**Excluded**

* Levenshtein or other typo forgiveness (typos are **never** accepted)  
* Synonym detection beyond variants provided in `acceptableAnswers`  
* Phonetic matching algorithms

A player’s guess must contain **every key token spelled exactly as in the accepted answer**.  
Stop‑words may be omitted and tokens can be in any order.

---

## 2. Implementation

```ts
// Stop‑words that can be ignored
const STOP_WORDS = new Set([
  "the", "a", "an", "of", "on", "in", "for", "to", "and", "or", "with",
  "is", "are", "was", "were", "at", "by", "from"
]);

// Normalize text while preserving important punctuation in abbreviations
private static normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Preserve periods in abbreviations like "U.S.A." or "Ph.D."
    .replace(/\b([A-Z]\.){2,}/g, (match) => match.replace(/\./g, ''))
    // Remove other punctuation
    .replace(/[^\w\s]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Break an answer into significant tokens
private static tokenize(answer: string): string[] {
  return this.normalizeText(answer)
    .split(/\s+/)
    .filter(token => token.length > 0 && !STOP_WORDS.has(token));
}

// Medium, typo‑strict matcher
static isAnswerAcceptable(userAnswer: string, acceptableAnswers: string[]): boolean {
  if (!userAnswer?.trim() || !acceptableAnswers?.length) {
    return false;
  }

  const userTokens = new Set(this.tokenize(userAnswer));

  if (userTokens.size === 0) {
    return false;
  }

  return acceptableAnswers.some(acc => {
    const accTokens = this.tokenize(acc);
    return accTokens.length > 0 && accTokens.every(tok => userTokens.has(tok));
  });
}
```

*Complexity*: `O(A × T)` where **A** = number of acceptable variants and **T** = avg. token count.

---

## 3. Behaviour Examples

| Accepted Variant | User Guess | Result | Reason |
|------------------|-----------|--------|--------|
| sun never sets | Sun **never** sets | ✅ | Case & stop‑word normalised |
| sun never sets | sun sets never | ✅ | Order‑agnostic |
| the sun never sets on the British Empire | Sun never sets on British Empire | ✅ | Stop‑words removed |
| sun never sets | sun never **setts** | ❌ | Typo rejected |
| U.S.A. | USA | ✅ | Abbreviation normalised |
| World War II | World War 2 | ❌ | Roman numeral vs digit |

---

## 4. Suggested Libraries (JavaScript / TypeScript)

| Task | Library | Why |
|------|---------|-----|
| Robust tokenisation & basic NLP utils | **`natural`** | Mature, MIT‑licensed. Provides tokenisers, stop‑words, Porter stemming if ever needed. |
| Lightweight stop‑word lists | **`stopword`** | Tiny package with curated lists in many languages; replace the hard‑coded array. |
| Abbreviation & punctuation handling | **`lodash.deburr`** + **`validator`** | `deburr` strips diacritics safely; `validator` has `stripLow`/`whitelist` helpers to reduce regex complexity. |
| (Optional) Advanced morphological parsing | **`wink-nlp-utils`** | Faster token + sentence segmentation than regex once throughput grows. |
| Test assertions | **`jest`** (already likely) | Snapshot tests for acceptance examples. |

> **Why not fuzzy‑match libs (rapidfuzz, fuzzball)?**  
> They specialise in edit‑distance scoring; since typos must *never* pass, their overhead isn’t justified here.

---

## 5. Integration Steps

1. **Replace hard‑coded stop‑word list** with `stopword.en`.  
2. **Swap regex tokeniser** with `natural.WordTokenizer` for readability.  
3. **Unit tests**: keep the table in Section 3 as fixtures.  
4. Monitor performance; if throughput drops, consider `wink-nlp-utils` for faster tokenisation.

---

## 6. Future Enhancement Opportunities (typo‑strict)

* **Number format flexibility** (“2” ↔ “two”, “II” ↔ “2”)  
* **Dynamic acceptable‑answer generation** via LLM for edge‑cases (e.g., scientific names)  
* **Locale support**: pluggable stop‑word lists for non‑English trivia rounds  

*(No fuzzy‑typo matching planned — policy is to remain typo‑strict.)*
