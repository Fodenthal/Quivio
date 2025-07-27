import { QuestionDatabase } from '../services/QuestionDatabase';

async function checkTopics() {
  const db = QuestionDatabase.getInstance();
  const topics = await db.getAvailableTopics();
  
  console.log('📚 Available topics in database:');
  console.log('================================');
  
  if (topics.length === 0) {
    console.log('No topics found in database');
    return;
  }
  
  topics.forEach(topic => {
    console.log(`  ${topic.topic} (difficulty ${topic.difficulty}): ${topic.count} questions`);
  });
  
  console.log('\n📊 Summary:');
  const totalQuestions = topics.reduce((sum, t) => sum + t.count, 0);
  const uniqueTopics = new Set(topics.map(t => t.topic));
  console.log(`  Total questions: ${totalQuestions}`);
  console.log(`  Unique topics: ${uniqueTopics.size}`);
  console.log(`  Topic/difficulty combinations: ${topics.length}`);
  
  db.close();
}

checkTopics().catch(error => {
  console.error('❌ Error checking topics:', error);
  process.exit(1);
}); 