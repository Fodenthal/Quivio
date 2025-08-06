import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function updateVectorDimensions(): Promise<void> {
  console.log('🔄 Updating vector dimensions from 768 to 1536...\n');
  
  try {
    // Step 1: Drop existing table and function
    console.log('-- Step 1: Dropping existing table and function');
    console.log('DROP TABLE IF EXISTS wiki_chunks CASCADE;');
    console.log('DROP FUNCTION IF EXISTS vector_search(vector, float, int);\n');
    
    // Step 2: Recreate table with 1536 dimensions
    console.log('-- Step 2: Recreate wiki_chunks table with 1536 dimensions');
    console.log(`CREATE TABLE IF NOT EXISTS wiki_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  section text,
  content text NOT NULL,
  embedding vector(1536),
  content_hash text UNIQUE NOT NULL,
  updated_at timestamptz DEFAULT now()
);\n`);
    
    // Step 3: Recreate HNSW index
    console.log('-- Step 3: Recreate HNSW index for fast vector search');
    console.log(`CREATE INDEX IF NOT EXISTS wiki_chunks_embedding_hnsw 
ON wiki_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);\n`);
    
    // Step 4: Recreate vector search function
    console.log('-- Step 4: Recreate vector search function with 1536 dimensions');
    console.log(`CREATE OR REPLACE FUNCTION vector_search(
  query_embedding vector(1536),
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
    console.log('\n✅ Verifying updated vector store setup...');
    
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
      // Create a test embedding (zeros) with 1536 dimensions
      const testEmbedding = Array(1536).fill(0);
      
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
    
    console.log('\n🎉 Vector dimensions update complete!');
    console.log('\nNext steps:');
    console.log('1. Run the ingest_worker script to test Wikipedia ingestion');
    console.log('2. Test the /get-context endpoint in the rag-service');
    
  } catch (error) {
    console.error('❌ Error updating vector dimensions:', error);
    process.exit(1);
  }
}

// Run the migration
updateVectorDimensions().catch(console.error); 