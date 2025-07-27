#!/usr/bin/env tsx

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration: Setup Vector Store Infrastructure
 * 
 * This script provides the SQL commands to set up the vector store
 * and then verifies the setup is working correctly.
 */
async function setupVectorStore(): Promise<void> {
  console.log('🔧 Setting up Vector Store infrastructure...\n');

  try {
    // Check for required environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const databaseType = process.env.DATABASE_TYPE;
    
    if (databaseType !== 'supabase') {
      console.error('❌ DATABASE_TYPE must be set to "supabase"');
      console.log('Please update your .env file: DATABASE_TYPE=supabase');
      process.exit(1);
    }
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration required for vector store');
      console.log('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
      process.exit(1);
    }

    console.log('📋 Configuration:');
    console.log(`Database Type: ${databaseType}`);
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
    
    // Connect to Supabase
    console.log('\n🔌 Connecting to Supabase...');
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connectivity
    const { data: testData, error: testError } = await client
      .from('questions')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Could not connect to Supabase:', testError.message);
      console.log('Please verify your SUPABASE_URL and SUPABASE_ANON_KEY are correct');
      process.exit(1);
    }
    
    console.log('✅ Supabase connection verified');
    
    // Provide SQL commands to run manually
    console.log('\n📋 Please run the following SQL commands in your Supabase SQL Editor:');
    console.log('   (Dashboard > SQL Editor > New Query)\n');
    
    console.log('-- Step 1: Enable pgvector extension');
    console.log('CREATE EXTENSION IF NOT EXISTS vector;\n');
    
    console.log('-- Step 2: Create wiki_chunks table');
    console.log(`CREATE TABLE IF NOT EXISTS wiki_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  section text,
  content text NOT NULL,
  embedding vector(768),
  content_hash text UNIQUE NOT NULL,
  updated_at timestamptz DEFAULT now()
);\n`);
    
    console.log('-- Step 3: Create HNSW index for fast vector search');
    console.log(`CREATE INDEX IF NOT EXISTS wiki_chunks_embedding_hnsw 
ON wiki_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);\n`);
    
    console.log('-- Step 4: Create vector search function');
    console.log(`CREATE OR REPLACE FUNCTION vector_search(
  query_embedding vector(768),
  similarity_threshold float DEFAULT 0.12,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  entity text,
  section text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wiki_chunks.id,
    wiki_chunks.entity,
    wiki_chunks.section,
    wiki_chunks.content,
    1 - (wiki_chunks.embedding <=> query_embedding) AS similarity
  FROM wiki_chunks
  WHERE wiki_chunks.embedding IS NOT NULL
  ORDER BY wiki_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;\n`);
    
    console.log('🔄 After running the SQL above, press Enter to verify the setup...');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve(null));
    });
    
    // Verify setup
    console.log('\n✅ Verifying vector store setup...');
    
    // Check if wiki_chunks table exists
    try {
      const { data, error } = await client
        .from('wiki_chunks')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ wiki_chunks table not found:', error.message);
        console.log('Please make sure you ran the CREATE TABLE command above.');
      } else {
        console.log(`✅ wiki_chunks table verified (current rows: ${data?.[0]?.count || 0})`);
      }
    } catch (error) {
      console.error('❌ Could not verify wiki_chunks table:', error);
    }
    
    // Test vector search function
    try {
      // Create a test embedding (zeros)
      const testEmbedding = Array(768).fill(0);
      
      const { data, error } = await client.rpc('vector_search', {
        query_embedding: testEmbedding,
        match_count: 1
      });
      
      if (error) {
        console.error('❌ vector_search function not working:', error.message);
        console.log('Please make sure you ran the CREATE FUNCTION command above.');
      } else {
        console.log('✅ vector_search function verified (returned', data?.length || 0, 'results)');
      }
    } catch (error) {
      console.error('❌ Could not test vector_search function:', error);
    }
    
    console.log('\n🎉 Vector store setup verification complete!');
    console.log('\nNext steps:');
    console.log('1. If any verifications failed, re-run the corresponding SQL commands');
    console.log('2. Proceed to Phase 2: Enhance the rag-service with vector capabilities');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupVectorStore().catch(console.error);
}

export { setupVectorStore }; 