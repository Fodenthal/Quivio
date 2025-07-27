#!/usr/bin/env tsx

import "dotenv/config";
import { DatabaseFactory } from './src/services/DatabaseFactory';

async function testDatabase() {
  console.log('🔄 Forcing DatabaseFactory reset...');
  DatabaseFactory.resetInstance();
  
  console.log('🔧 Getting fresh database instance...');
  const db = DatabaseFactory.getInstance();
  
  console.log('📊 Testing database stats...');
  try {
    const stats = await db.getStats();
    console.log('✅ Database stats:', stats);
    
    const questions = await db.getAllQuestions(1);
    console.log('✅ Sample question:', questions[0] ? Object.keys(questions[0]) : 'No questions');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase(); 