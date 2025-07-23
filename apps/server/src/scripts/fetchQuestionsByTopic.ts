import { QuestionDatabase } from '../services/QuestionDatabase';

/**
 * A command-line script to fetch all questions for one or more topics from the database.
 * 
 * Usage:
 * pnpm tsx apps/server/src/scripts/fetchQuestionsByTopic.ts "Topic One" "Topic Two" "Another Topic"
 */

async function fetchQuestions() {
  const topics = process.argv.slice(2);

  if (topics.length === 0) {
    console.error('Error: Please provide at least one topic as an argument.');
    console.log('Usage: pnpm tsx apps/server/src/scripts/fetchQuestionsByTopic.ts "Topic One" "Topic Two"');
    process.exit(1);
  }

  console.log(`🔍 Fetching all questions for topics: "${topics.join('", "')}"...`);

  try {
    const db = QuestionDatabase.getInstance();
    const allDifficulties = [1, 2, 3, 4, 5];
    const results: { [topic: string]: any[] } = {};
    let totalQuestionsFound = 0;

    for (const topic of topics) {
      const questionsForTopic = [];
      for (const difficulty of allDifficulties) {
        // Set a very high limit to fetch all questions for the difficulty level
        const questions = db.getQuestions(topic, difficulty, 10000);
        if (questions.length > 0) {
          questionsForTopic.push(...questions);
        }
      }
      if (questionsForTopic.length > 0) {
        results[topic] = questionsForTopic;
        totalQuestionsFound += questionsForTopic.length;
      }
    }

    if (totalQuestionsFound === 0) {
      console.log(`
No questions found for the specified topics.`);
    } else {
      console.log(`
✅ Found a total of ${totalQuestionsFound} questions across ${Object.keys(results).length} topics:
`);
      console.log(JSON.stringify(results, null, 2));
    }

  } catch (error) {
    console.error('An error occurred while fetching questions:', error);
    process.exit(1);
  }
}

fetchQuestions();
