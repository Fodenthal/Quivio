#!/usr/bin/env node

const WDQS_ENDPOINT = 'https://query.wikidata.org/sparql';
const TOPIC = process.env.QUIVIO_TOPIC ?? 'Movie Directors';
const QUESTION_TEXT = process.env.QUIVIO_QUESTION ?? 'Who directed this movie?';
const QUESTION_TEMPLATE = process.env.QUIVIO_QUESTION_TEMPLATE ?? QUESTION_TEXT;
const CATEGORY = process.env.QUIVIO_CATEGORY ?? 'Movies';
const DIFFICULTY = Number(process.env.QUIVIO_DIFFICULTY ?? 2);

const TARGET_TABLE = process.env.QUIVIO_TARGET_TABLE ?? 'public.questions';
const ENABLE_UPSERT = (process.env.QUIVIO_ENABLE_UPSERT ?? 'true').toLowerCase() !== 'false';
const INCLUDE_IMAGE_HASH = (process.env.QUIVIO_INCLUDE_IMAGE_SHA ?? 'true').toLowerCase() !== 'false';

const REQUIRE_IMDB = (process.env.QUIVIO_REQUIRE_IMDB ?? 'true').toLowerCase() !== 'false';
const REQUIRE_ROTTEN_TOMATOES = (process.env.QUIVIO_REQUIRE_RT ?? 'true').toLowerCase() !== 'false';
const ANSWER_MODE = (process.env.QUIVIO_ANSWER_MODE ?? 'director').toLowerCase();
const REQUIRE_DIRECTOR = (process.env.QUIVIO_REQUIRE_DIRECTOR ?? 'true').toLowerCase() !== 'false';
const LABEL_LANGS = (process.env.QUIVIO_LABEL_LANGS ?? 'en,en-gb,en-ca,en-us,fr,de,es,it,pt,ru,ja,zh,cs,pl,no,nn,sv,da,nl,fi,hu,sk,sl,ro,uk,ca,el,tr,ar,ko,vi,th,hi,[AUTO_LANGUAGE]').trim();

const VALID_ANSWER_MODES = new Set(['director', 'title']);
if (!VALID_ANSWER_MODES.has(ANSWER_MODE)) {
  console.error(`Unsupported QUIVIO_ANSWER_MODE: ${ANSWER_MODE}. Expected one of: ${[...VALID_ANSWER_MODES].join(', ')}`);
  process.exit(1);
}

const NEED_DIRECTOR = ANSWER_MODE === 'director' || REQUIRE_DIRECTOR;
const ALIAS_LANGS = (process.env.QUIVIO_ALIAS_LANGS ?? LABEL_LANGS)
  .split(',')
  .map((lang) => lang.trim())
  .filter(Boolean);
const SITE_LANGS = (process.env.QUIVIO_SITE_LANGS ?? LABEL_LANGS)
  .split(',')
  .map((lang) => lang.trim())
  .filter(Boolean);
const FORCE_REFRESH = (process.env.QUIVIO_FORCE_REFRESH ?? 'false').toLowerCase() === 'true';
const FIXED_QIDS = (process.env.QUIVIO_FIXED_QIDS ?? '')
  .split(',')
  .map((qid) => qid.trim())
  .filter(Boolean);

const AWARD_QIDS = (process.env.QUIVIO_AWARD_QIDS ?? [
  'Q103360', // Academy Award for Best Picture
  'Q103039', // Academy Award for Best Director
  'Q19020',  // Golden Globe Award for Best Motion Picture – Drama
  'Q229883', // Golden Globe Award for Best Motion Picture – Musical or Comedy
  'Q54502243', // BAFTA Award for Best Film
  'Q2606110', // Palme d'Or
  'Q27121215', // Critics' Choice Movie Award for Best Picture
].join(',')
).split(',').map(q => q.trim()).filter(Boolean);

const ENTITY_CLASSES = (process.env.QUIVIO_ENTITY_CLASSES ?? 'Q11424')
  .split(',')
  .map(q => q.trim())
  .filter(Boolean);

const COUNTRY_QIDS = (process.env.QUIVIO_COUNTRY_QIDS ?? '')
  .split(',')
  .map(q => q.trim())
  .filter(Boolean);

const POSTER_REGEX = (process.env.QUIVIO_POSTER_REGEX ?? '(poster|theatrical|dvd|blu-ray|bluray|onesheet|one-sheet)')
  .trim();

const PAGE_SIZE = Number(process.argv[2] ?? process.env.QUIVIO_PAGE_SIZE ?? 50);
const OFFSET = Number(process.argv[3] ?? process.env.QUIVIO_OFFSET ?? 0);
const APPLY = process.argv.includes('--apply') || (process.env.QUIVIO_APPLY ?? '').toLowerCase() === 'true';
const DATABASE_URL = process.env.QUIVIO_DATABASE_URL || process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;

if (!Number.isFinite(PAGE_SIZE) || PAGE_SIZE <= 0) {
  console.error('Invalid page size. Provide a positive number.');
  process.exit(1);
}

if (!Number.isFinite(OFFSET) || OFFSET < 0) {
  console.error('Invalid offset. Provide a non-negative number.');
  process.exit(1);
}

async function runSparql(query) {
  const response = await fetch(WDQS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query',
      'Accept': 'application/sparql-results+json',
      'User-Agent': 'Quivio-Ingest/1.0 (contact@quivio.example)'
    },
    body: query,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SPARQL ${response.status}: ${text}`);
  }

  return response.json();
}

function bindingsToRows(json) {
  return json.results.bindings.map(binding => {
    const row = {};
    for (const [key, value] of Object.entries(binding)) {
      row[key] = value.value;
    }
    return row;
  });
}

function buildPosterFilterClause() {
  if (!POSTER_REGEX) {
    return '';
  }

  const escaped = POSTER_REGEX.replace(/"/g, '\\"');
  return `FILTER(REGEX(LCASE(STR(?poster)), "${escaped}"))`;
}

function buildAwardClauseLines() {
  if (!AWARD_QIDS.length) {
    return [];
  }
  const valuesClause = AWARD_QIDS.map(qid => `wd:${qid}`).join(' ');
  return [
    '  ?item wdt:P166 ?award.',
    `  VALUES ?award { ${valuesClause} }`,
  ];
}

function buildIdQuery(limit, offset) {
  const posterFilter = buildPosterFilterClause();
  const awardClauseLines = buildAwardClauseLines();

  const lines = ['SELECT DISTINCT ?item WHERE {'];

  if (ENTITY_CLASSES.length) {
    lines.push('  VALUES ?class { ' + ENTITY_CLASSES.map(qid => `wd:${qid}`).join(' ') + ' }');
    lines.push('  ?item wdt:P31 ?class;');
  } else {
    lines.push('  ?item');
  }

  const statements = ENTITY_CLASSES.length
    ? (NEED_DIRECTOR ? ['wdt:P57 ?director', 'wdt:P18 ?poster'] : ['wdt:P18 ?poster'])
    : (NEED_DIRECTOR ? ['wdt:P31 wd:Q11424', 'wdt:P57 ?director', 'wdt:P18 ?poster'] : ['wdt:P31 wd:Q11424', 'wdt:P18 ?poster']);

  if (REQUIRE_IMDB) {
    statements.push('wdt:P345 ?imdb');
  }

  if (REQUIRE_ROTTEN_TOMATOES) {
    statements.push('wdt:P1258 ?rotten');
  }

  statements.forEach((statement, idx) => {
    const suffix = idx === statements.length - 1 ? '.' : ';';
    if (ENTITY_CLASSES.length) {
      const prefix = idx === 0 ? '        ' : '        ';
      lines.push(`${prefix}${statement}${suffix}`);
    } else {
      const prefix = idx === 0 ? '  ?item ' : '        ';
      lines.push(`${prefix}${statement}${suffix}`);
    }
  });

  if (COUNTRY_QIDS.length) {
    lines.push('  VALUES ?country { ' + COUNTRY_QIDS.map(qid => `wd:${qid}`).join(' ') + ' }');
    lines.push('  ?item wdt:P495 ?country.');
  }

  if (awardClauseLines.length) {
    lines.push(...awardClauseLines);
  }

  if (posterFilter) {
    lines.push(`  ${posterFilter}`);
  }

  lines.push('}');
  lines.push('ORDER BY ?item');
  lines.push(`LIMIT ${limit}`);
  lines.push(`OFFSET ${offset}`);

  return lines.filter(Boolean).join('\n');
}

function buildFilmDetailsQuery(qids) {
  const valuesClause = qids.map(qid => `wd:${qid}`).join(' ');
  const posterFilter = buildPosterFilterClause();
  const siteLanguageList = SITE_LANGS.filter(lang => lang && !lang.startsWith('['));
  const siteLangFilter = siteLanguageList.length
    ? `FILTER(?siteLang IN (${siteLanguageList.map(lang => `"${lang}"`).join(', ')}))`
    : '';

  const lines = [
    'PREFIX schema: <http://schema.org/>',
    'SELECT ?item ?itemLabel ?poster ?director ?directorLabel ?enwikiTitle ?officialName ?nativeName ?siteTitle WHERE {',
    `  VALUES ?item { ${valuesClause} }`,
    '  ?item wdt:P18 ?poster.',
  ];

  if (NEED_DIRECTOR) {
    lines.push('  ?item wdt:P57 ?director.');
  } else {
    lines.push('  OPTIONAL { ?item wdt:P57 ?director. }');
  }

  if (posterFilter) {
    lines.push(`  ${posterFilter}`);
  }

  lines.push('  OPTIONAL { ?sitelink schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?enwikiTitle. }');
  lines.push('  OPTIONAL { ?item wdt:P1448 ?officialName. }');
  lines.push('  OPTIONAL { ?item wdt:P1705 ?nativeName. }');
  if (siteLangFilter) {
    lines.push('  OPTIONAL { ?site schema:about ?item; schema:name ?siteTitle; schema:inLanguage ?siteLang. ' + siteLangFilter + ' }');
  } else {
    lines.push('  OPTIONAL { ?site schema:about ?item; schema:name ?siteTitle. }');
  }
  lines.push(`  SERVICE wikibase:label { bd:serviceParam wikibase:language "${LABEL_LANGS}". }`);
  lines.push('}');
  lines.push('ORDER BY ?itemLabel');

  return lines.join('\n');
}

function buildDirectorAliasQuery(qids) {
  if (!qids.length) {
    return null;
  }

  const valuesClause = qids.map(qid => `wd:${qid}`).join(' ');
  return `
SELECT ?director ?alias WHERE {
  VALUES ?director { ${valuesClause} }
  ?director skos:altLabel ?alias
}
ORDER BY ?director ?alias
`.trim();
}

function buildFilmAliasQuery(qids) {
  if (!qids.length) {
    return null;
  }

  const valuesClause = qids.map(qid => `wd:${qid}`).join(' ');
  return `
SELECT ?item ?alias WHERE {
  VALUES ?item { ${valuesClause} }
  ?item skos:altLabel ?alias
}
ORDER BY ?item ?alias
`.trim();
}

function escapeLiteral(text) {
  return text.replace(/'/g, "''");
}

function sanitizePosterUrl(url) {
  return url.startsWith('https://') ? url : url.replace('http://', 'https://');
}

function isSafeIdentifier(value) {
  return /^[a-zA-Z0-9_.]+$/.test(value);
}

function cleanName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  const trimmed = name.trim();
  if (!trimmed || /^Q\d+/i.test(trimmed)) {
    return '';
  }
  return trimmed.replace(/[\s_]+/g, ' ');
}

async function getExistingPairs(client, targetTable, category) {
  if (!category) {
    return new Set();
  }

  if (FORCE_REFRESH) {
    return new Set();
  }

  if (!isSafeIdentifier(targetTable)) {
    throw new Error(`Unsafe target table name: ${targetTable}`);
  }

  const query = `SELECT question, correct_answer, category FROM ${targetTable} WHERE category = $1`;
  const { rows } = await client.query(query, [category]);
  const set = new Set();
  for (const row of rows) {
    set.add(`${row.question}||${row.correct_answer}`);
  }
  return set;
}

function formatQuestion(title) {
  if (!title) {
    return QUESTION_TEXT;
  }

  const replacements = [
    ['{TITLE}', title],
    ['{{TITLE}}', title],
    ['{title}', title],
  ];

  let formatted = QUESTION_TEMPLATE;
  for (const [placeholder, value] of replacements) {
    formatted = formatted.split(placeholder).join(value);
  }

  return formatted;
}

function mergeData(filmRows, directorAliasRows = [], filmAliasRows = []) {
  const directorAliasMap = new Map();
  for (const row of directorAliasRows) {
    if (!row.director) continue;
    const directorQid = row.director.split('/').pop();
    if (!directorAliasMap.has(directorQid)) {
      directorAliasMap.set(directorQid, new Set());
    }
    directorAliasMap.get(directorQid).add(row.alias);
  }

  const filmAliasMap = new Map();
  for (const row of filmAliasRows) {
    if (!row.item) continue;
    const filmQid = row.item.split('/').pop();
    if (!filmAliasMap.has(filmQid)) {
      filmAliasMap.set(filmQid, new Set());
    }
    filmAliasMap.get(filmQid).add(row.alias);
  }

  const filmMap = new Map();

  for (const row of filmRows) {
    const filmQid = row.item.split('/').pop();
    const directorQid = row.director ? row.director.split('/').pop() : null;
    const labelCandidates = [row.itemLabel, row.enwikiTitle, row.officialName, row.nativeName, row.siteTitle].filter(Boolean);
    const preferredLabel = labelCandidates.find(name => !/^Q\d+/i.test(name)) || labelCandidates[0] || '';

    if (!filmMap.has(filmQid)) {
      filmMap.set(filmQid, {
        qid: filmQid,
        label: preferredLabel,
        poster: row.poster,
        directors: new Map(),
        aliases: [],
      });
    } else if (!cleanName(filmMap.get(filmQid).label) && preferredLabel) {
      filmMap.get(filmQid).label = preferredLabel;
    }

    const filmEntry = filmMap.get(filmQid);

    for (const candidate of [row.enwikiTitle, row.officialName, row.nativeName, row.siteTitle]) {
      if (candidate) {
        filmEntry.aliases.push(candidate);
      }
    }

    if (directorQid) {
      if (!filmEntry.directors.has(directorQid)) {
        filmEntry.directors.set(directorQid, {
          qid: directorQid,
          label: row.directorLabel,
          aliases: [],
        });
      }
    }
  }

  for (const film of filmMap.values()) {
    const filmAliasSet = filmAliasMap.get(film.qid);
    if (filmAliasSet) {
      film.aliases = Array.from(filmAliasSet).filter(Boolean);
    }
    for (const director of film.directors.values()) {
      const aliasSet = directorAliasMap.get(director.qid);
      if (aliasSet) {
        director.aliases = Array.from(aliasSet).filter(Boolean);
      }
    }
  }

  return [...filmMap.values()].map(film => ({
    ...film,
    directors: [...film.directors.values()],
  }));
}

function makeSql(entries, targetTable, enableUpsert, includeImageHash, answerMode, existingPairs = new Set()) {
  const rows = [];
  const seenPairs = new Set(existingPairs);

  for (const entry of entries) {
    let correctAnswer = '';
    const questionText = formatQuestion(entry.label);
    const acceptable = new Set();

    if (answerMode === 'director') {
      const directors = (entry.directors || []).filter(d => cleanName(d.label));
      if (!directors.length) {
        continue;
      }

      const directorNames = directors.map(d => cleanName(d.label)).filter(Boolean);
      correctAnswer = directorNames.join(' & ');

      if (correctAnswer) acceptable.add(correctAnswer);
      for (const director of directors) {
        const cleaned = cleanName(director.label);
        if (cleaned) acceptable.add(cleaned);
        for (const alias of director.aliases || []) {
          const aliasClean = cleanName(alias);
          if (aliasClean) acceptable.add(aliasClean);
        }
      }
    } else {
      let filmLabel = cleanName(entry.label);
      if (!filmLabel) {
        for (const alias of entry.aliases || []) {
          const aliasClean = cleanName(alias);
          if (aliasClean) {
            filmLabel = aliasClean;
            break;
          }
        }
      }

      if (!filmLabel) {
        continue;
      }

      correctAnswer = filmLabel;
      acceptable.add(filmLabel);
      for (const alias of entry.aliases || []) {
        const aliasClean = cleanName(alias);
        if (aliasClean) acceptable.add(aliasClean);
      }
    }

    const acceptableJson = JSON.stringify([...acceptable].filter(Boolean));
    const imageJson = JSON.stringify({ url: sanitizePosterUrl(entry.poster) });

    const pairKey = `${questionText}||${correctAnswer}`;
    if (seenPairs.has(pairKey)) {
      continue;
    }
    seenPairs.add(pairKey);

    const rowValues = [
      `'${escapeLiteral(TOPIC)}'`,
      `${DIFFICULTY}`,
      `'${escapeLiteral(questionText)}'`,
      `'${escapeLiteral(correctAnswer)}'`,
      `'${escapeLiteral(acceptableJson)}'::jsonb`,
      `'${escapeLiteral(CATEGORY)}'`,
      `'${escapeLiteral(imageJson)}'::jsonb`,
      `'wdqs_p18'`,
      `'${entry.qid}'`,
    ];

    if (includeImageHash) {
      rowValues.push('NULL');
    }

    rows.push(`(${rowValues.join(', ')})`);
  }

  const columns = [
    'topic',
    'difficulty',
    'question',
    'correct_answer',
    'acceptable_answers',
    'category',
    'image',
    'external_source',
    'external_id',
  ];

  if (includeImageHash) {
    columns.push('image_sha256');
  }

  if (!rows.length) {
    throw new Error('No rows produced for SQL insert.');
  }

  const insertHead = `INSERT INTO ${targetTable} (${columns.join(', ')})`;

  if (!enableUpsert) {
    return {
      sql: `${insertHead}\nVALUES\n  ${rows.join(',\n  ')};`,
      rowCount: rows.length,
    };
  }

  const updateAssignments = [
    'topic = EXCLUDED.topic',
    'difficulty = EXCLUDED.difficulty',
    'question = EXCLUDED.question',
    'correct_answer = EXCLUDED.correct_answer',
    'acceptable_answers = EXCLUDED.acceptable_answers',
    'category = EXCLUDED.category',
    'image = EXCLUDED.image',
    'external_source = EXCLUDED.external_source',
  ];

  if (includeImageHash) {
    updateAssignments.push('image_sha256 = EXCLUDED.image_sha256');
  }

  return {
    sql: `${insertHead}\nVALUES\n  ${rows.join(',\n  ')}\nON CONFLICT (external_source, external_id) DO UPDATE\nSET ${updateAssignments.join(',\n    ')};`,
    rowCount: rows.length,
  };
}

function buildPgConfig(url) {
  try {
    const parsed = new URL(url);
    return {
      config: {
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 5432,
        user: decodeURIComponent(parsed.username || ''),
        password: decodeURIComponent(parsed.password || ''),
        database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
      },
      metadata: {
        sslmode: parsed.searchParams.get('sslmode'),
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse database URL: ${error.message}`);
  }
}

async function main() {
  let qids = [];
  if (FIXED_QIDS.length) {
    qids = FIXED_QIDS;
  } else {
    const idQuery = buildIdQuery(PAGE_SIZE, OFFSET);
    const idResults = await runSparql(idQuery);
    const idRows = bindingsToRows(idResults);
    qids = idRows.map(row => row.item.split('/').pop());

    if (!qids.length) {
      console.error('No Q-IDs returned for this page.');
      return;
    }
  }

  const filmQuery = buildFilmDetailsQuery(qids);
  const filmResults = await runSparql(filmQuery);
  const filmRows = bindingsToRows(filmResults);

  const directorQids = Array.from(new Set(
    filmRows
      .map(row => row.director ? row.director.split('/').pop() : null)
      .filter(Boolean)
  ));

  let directorAliasRows = [];
  let filmAliasRows = [];

  if (ANSWER_MODE === 'director') {
    const aliasQuery = buildDirectorAliasQuery(directorQids);
    if (aliasQuery) {
      const aliasResults = await runSparql(aliasQuery);
      directorAliasRows = bindingsToRows(aliasResults);
    }
  } else {
    const filmAliasQuery = buildFilmAliasQuery(qids);
    if (filmAliasQuery) {
      const filmAliasResults = await runSparql(filmAliasQuery);
      filmAliasRows = bindingsToRows(filmAliasResults);
    }
  }

  const entries = mergeData(filmRows, directorAliasRows, filmAliasRows);
  if (!entries.length) {
    console.error('Film query returned no rows with directors.');
    return;
  }

  if (!APPLY) {
    const { sql } = makeSql(entries, TARGET_TABLE, ENABLE_UPSERT, INCLUDE_IMAGE_HASH, ANSWER_MODE);
    console.log(sql);
    return;
  }

  if (!DATABASE_URL) {
    console.error('Missing database connection string. Set QUIVIO_DATABASE_URL, STAGING_DATABASE_URL, or DATABASE_URL.');
    process.exit(1);
  }

  const { Client } = await import('pg');
  const { config: baseConfig, metadata } = buildPgConfig(DATABASE_URL);
  const pgConfig = { ...baseConfig };

  const shouldEnableSsl = pgConfig.host && (/supabase\.(net|com)/.test(pgConfig.host) || (process.env.QUIVIO_FORCE_SSL ?? '').toLowerCase() === 'true' || Boolean(metadata.sslmode));
  const defaultRejectSetting = shouldEnableSsl && /supabase\.(net|com)/.test(pgConfig.host) ? 'false' : 'true';
  const rejectUnauthorized = (process.env.QUIVIO_SSL_REJECT_UNAUTHORIZED ?? defaultRejectSetting).toLowerCase() !== 'false';

  if (shouldEnableSsl) {
    pgConfig.ssl = { rejectUnauthorized };
  }

  const client = new Client(pgConfig);

  try {
    await client.connect();
    const existingPairs = await getExistingPairs(client, TARGET_TABLE, CATEGORY);
    const { sql, rowCount } = makeSql(entries, TARGET_TABLE, ENABLE_UPSERT, INCLUDE_IMAGE_HASH, ANSWER_MODE, existingPairs);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    const actionVerb = ENABLE_UPSERT ? 'Inserted/updated' : 'Inserted';
    console.log(`${actionVerb} ${rowCount} rows into ${TARGET_TABLE}.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch(error => {
  console.error('Ingest script failed:', error);
  process.exit(1);
});
