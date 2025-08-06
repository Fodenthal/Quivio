import { QuestionDatabase } from '../services/QuestionDatabase';

async function getCount() {
  const db = QuestionDatabase.getInstance();
  const stats = await db.getStats();
  console.log(`Total questions in database: ${stats.totalQuestions}`);
  db.close(); // Close the database connection after getting stats
}

getCount();
