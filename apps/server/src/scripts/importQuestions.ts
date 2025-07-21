import fs from 'fs';
import path from 'path';
import { QuestionDatabase } from '../services/QuestionDatabase';
import { GeneratedQuestion } from '../services/GeminiService';

interface ImportOptions {
  directory: string;
  topic?: string;
  difficulty?: number;
  dryRun: boolean;
  verbose: boolean;
}

interface ImportResult {
  filePath: string;
  success: boolean;
  questionsProcessed: number;
  questionsImported: number;
  duplicatesSkipped: number;
  errors: string[];
}

interface ImportStats {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  totalQuestionsProcessed: number;
  totalQuestionsImported: number;
  totalDuplicatesSkipped: number;
  totalErrors: number;
}

/**
 * Parse command line arguments
 */
function parseArguments(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    directory: '',
    dryRun: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--topic':
        options.topic = args[++i];
        break;
      case '--difficulty':
        const difficulty = parseInt(args[++i]);
        if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
          console.error('❌ Difficulty must be a number between 1 and 5');
          process.exit(1);
        }
        options.difficulty = difficulty;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        if (!options.directory) {
          options.directory = arg;
        } else {
          console.error(`❌ Unknown argument: ${arg}`);
          printUsage();
          process.exit(1);
        }
    }
  }

  if (!options.directory) {
    console.error('❌ Directory path is required');
    printUsage();
    process.exit(1);
  }

  return options;
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
📚 Question Import Script

Usage: pnpm tsx src/scripts/importQuestions.ts <directory> [options]

Arguments:
  directory              Path to directory containing JSON files

Options:
  --topic <topic>        Override topic for all questions in files
  --difficulty <1-5>     Override difficulty for all questions in files
  --dry-run              Preview what would be imported without making changes
  --verbose, -v          Enable verbose logging
  --help, -h             Show this help message

Examples:
  pnpm tsx src/scripts/importQuestions.ts ./data/questions/
  pnpm tsx src/scripts/importQuestions.ts ./data/questions/ --topic "Science" --difficulty 3
  pnpm tsx src/scripts/importQuestions.ts ./data/questions/ --dry-run --verbose

JSON File Format:
  Files should contain an array of GeneratedQuestion objects:
  [
    {
      "question": "What is...?",
      "correctAnswer": "Answer",
      "acceptableAnswers": ["Answer", "answer"],
      "category": "Category",
      "difficulty": 3
    }
  ]
`);
}

/**
 * Validate a GeneratedQuestion object
 */
function validateQuestion(question: any, filePath: string, index: number): string[] {
  const errors: string[] = [];
  
  if (!question || typeof question !== 'object') {
    errors.push(`Question ${index}: Not a valid object`);
    return errors;
  }

  if (!question.question || typeof question.question !== 'string') {
    errors.push(`Question ${index}: Missing or invalid 'question' field`);
  }

  if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
    errors.push(`Question ${index}: Missing or invalid 'correctAnswer' field`);
  }

  if (!Array.isArray(question.acceptableAnswers)) {
    errors.push(`Question ${index}: Missing or invalid 'acceptableAnswers' field (must be array)`);
  } else if (question.acceptableAnswers.length === 0) {
    errors.push(`Question ${index}: 'acceptableAnswers' array cannot be empty`);
  }

  if (!question.category || typeof question.category !== 'string') {
    errors.push(`Question ${index}: Missing or invalid 'category' field`);
  }

  if (question.difficulty !== undefined) {
    if (typeof question.difficulty !== 'number' || question.difficulty < 1 || question.difficulty > 5) {
      errors.push(`Question ${index}: 'difficulty' must be a number between 1 and 5`);
    }
  }

  return errors;
}

/**
 * Process a single JSON file
 */
function processFile(filePath: string, options: ImportOptions, db: QuestionDatabase): ImportResult {
  const result: ImportResult = {
    filePath,
    success: false,
    questionsProcessed: 0,
    questionsImported: 0,
    duplicatesSkipped: 0,
    errors: []
  };

  try {
    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      result.errors.push('File does not contain an array of questions');
      return result;
    }

    if (data.length === 0) {
      result.errors.push('File contains no questions');
      return result;
    }

    // Process each question
    for (let i = 0; i < data.length; i++) {
      const questionData = data[i];
      result.questionsProcessed++;

      // Validate question structure
      const validationErrors = validateQuestion(questionData, filePath, i);
      if (validationErrors.length > 0) {
        result.errors.push(...validationErrors);
        continue;
      }

      // Create question object with overrides
      const question: GeneratedQuestion = {
        question: questionData.question.trim(),
        correctAnswer: questionData.correctAnswer.trim(),
        acceptableAnswers: questionData.acceptableAnswers.map((ans: string) => ans.trim()),
        category: questionData.category.trim(),
        difficulty: options.difficulty ?? questionData.difficulty ?? 3
      };

      // Determine topic (file-level override or extract from filename)
      const topic = options.topic ?? extractTopicFromFilename(filePath) ?? 'General';

      if (options.verbose) {
        console.log(`  📝 Processing: "${question.question}" (${topic}, difficulty ${question.difficulty})`);
      }

      if (!options.dryRun) {
        // Attempt to store in database
        const stored = db.storeQuestion(topic, question.difficulty, question);
        if (stored) {
          result.questionsImported++;
        } else {
          result.duplicatesSkipped++;
        }
      } else {
        // In dry-run mode, simulate storage
        result.questionsImported++;
      }
    }

    result.success = result.errors.length === 0;
    
  } catch (error) {
    result.errors.push(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Extract topic from filename (e.g., "science_questions.json" -> "science")
 */
function extractTopicFromFilename(filePath: string): string | null {
  const filename = path.basename(filePath, '.json');
  const topic = filename.replace(/[_-]/g, ' ').replace(/\b(questions?|quiz|trivia)\b/gi, '').trim();
  return topic || null;
}

/**
 * Get all JSON files from directory
 */
function getJsonFiles(directory: string): string[] {
  try {
    const files = fs.readdirSync(directory);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(directory, file));
  } catch (error) {
    console.error(`❌ Failed to read directory ${directory}:`, error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Print import statistics
 */
function printStats(stats: ImportStats, options: ImportOptions): void {
  console.log('\n📊 Import Statistics:');
  console.log(`   Files processed: ${stats.totalFiles}`);
  console.log(`   Successful files: ${stats.successfulFiles}`);
  console.log(`   Failed files: ${stats.failedFiles}`);
  console.log(`   Questions processed: ${stats.totalQuestionsProcessed}`);
  
  if (options.dryRun) {
    console.log(`   Questions that would be imported: ${stats.totalQuestionsImported}`);
  } else {
    console.log(`   Questions imported: ${stats.totalQuestionsImported}`);
    console.log(`   Duplicates skipped: ${stats.totalDuplicatesSkipped}`);
  }
  
  console.log(`   Total errors: ${stats.totalErrors}`);
  
  if (stats.totalErrors > 0) {
    console.log('\n⚠️  Some errors occurred during import. Check the output above for details.');
  }
}

/**
 * Main import function
 */
async function importQuestions(): Promise<void> {
  const options = parseArguments();
  
  console.log('📚 Question Import Script');
  console.log('========================');
  console.log(`Directory: ${options.directory}`);
  console.log(`Topic override: ${options.topic || 'None'}`);
  console.log(`Difficulty override: ${options.difficulty || 'None'}`);
  console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
  console.log(`Verbose: ${options.verbose ? 'Yes' : 'No'}`);
  console.log('');

  // Check if directory exists
  if (!fs.existsSync(options.directory)) {
    console.error(`❌ Directory does not exist: ${options.directory}`);
    process.exit(1);
  }

  // Get JSON files
  const jsonFiles = getJsonFiles(options.directory);
  if (jsonFiles.length === 0) {
    console.error(`❌ No JSON files found in directory: ${options.directory}`);
    process.exit(1);
  }

  console.log(`📁 Found ${jsonFiles.length} JSON file(s)`);
  if (options.verbose) {
    jsonFiles.forEach(file => console.log(`   ${path.basename(file)}`));
  }
  console.log('');

  // Initialize database
  const db = QuestionDatabase.getInstance();
  
  // Get initial stats
  const initialStats = db.getStats();
  console.log(`📊 Database stats before import: ${initialStats.totalQuestions} questions`);

  // Process files
  const results: ImportResult[] = [];
  const stats: ImportStats = {
    totalFiles: jsonFiles.length,
    successfulFiles: 0,
    failedFiles: 0,
    totalQuestionsProcessed: 0,
    totalQuestionsImported: 0,
    totalDuplicatesSkipped: 0,
    totalErrors: 0
  };

  for (const filePath of jsonFiles) {
    console.log(`📄 Processing: ${path.basename(filePath)}`);
    
    const result = processFile(filePath, options, db);
    results.push(result);
    
    // Update stats
    if (result.success) {
      stats.successfulFiles++;
    } else {
      stats.failedFiles++;
    }
    
    stats.totalQuestionsProcessed += result.questionsProcessed;
    stats.totalQuestionsImported += result.questionsImported;
    stats.totalDuplicatesSkipped += result.duplicatesSkipped;
    stats.totalErrors += result.errors.length;

    // Print file results
    if (result.success) {
      console.log(`   ✅ Success: ${result.questionsProcessed} questions processed`);
      if (!options.dryRun) {
        console.log(`      📥 Imported: ${result.questionsImported}`);
        console.log(`      ⏭️  Skipped (duplicates): ${result.duplicatesSkipped}`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.errors.length} errors`);
      if (options.verbose) {
        result.errors.forEach(error => console.log(`      ${error}`));
      }
    }
    console.log('');
  }

  // Print final statistics
  printStats(stats, options);

  // Show final database stats
  const finalStats = db.getStats();
  console.log(`📊 Database stats after import: ${finalStats.totalQuestions} questions`);
  
  if (!options.dryRun) {
    const imported = finalStats.totalQuestions - initialStats.totalQuestions;
    console.log(`📈 Net questions added: ${imported}`);
  }

  // Close database connection
  db.close();
  
  // Exit with error code if any files failed
  if (stats.failedFiles > 0) {
    process.exit(1);
  }
}

// Run the import
importQuestions().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
}); 