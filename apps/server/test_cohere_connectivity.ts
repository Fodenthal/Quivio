#!/usr/bin/env tsx

import { CohereService } from './src/services/CohereService';

async function testCohereConnectivity() {
  console.log('🧪 Testing CohereService connectivity...\n');

  const cohereService = new CohereService();
  
  // Check service status
  const status = cohereService.getStatus();
  console.log('📊 Service Status:', status);

  if (!status.configured) {
    console.log('\n❌ Service not properly configured. Please set:');
    console.log('   - COHERE_API_KEY');
    console.log('   - WEAVIATE_URL');
    console.log('   - WEAVIATE_API_KEY');
    return;
  }

  if (!status.available) {
    console.log('\n⚠️ Service configured but not available');
    return;
  }

  console.log('\n✅ Service is available and configured!');

  // Test Wiki context retrieval
  const testTopics = [
    'Marvel Cinematic Universe',
    'Python programming language',
    'Mount Everest'
  ];

  for (const topic of testTopics) {
    console.log(`\n🔍 Testing topic: "${topic}"`);
    try {
      const context = await cohereService.getWikiContext(topic);
      if (context) {
        console.log(`✅ Retrieved ${context.length} characters of context`);
        console.log(`📄 Preview: "${context.substring(0, 100)}..."`);
      } else {
        console.log(`⚠️ No context found for "${topic}"`);
      }
    } catch (error) {
      console.error(`❌ Error retrieving context for "${topic}":`, error);
    }
  }

  console.log('\n🎉 CohereService connectivity test completed!');
}

// Run the test
testCohereConnectivity().catch(console.error); 