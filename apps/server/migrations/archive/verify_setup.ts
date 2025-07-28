#!/usr/bin/env tsx

import { getDatabaseConfig } from '../../src/config';

/**
 * Verify that Supabase is properly configured
 */
async function verifySupabaseSetup(): Promise<void> {
  console.log('🔍 Verifying Supabase setup...\n');

  try {
    const config = getDatabaseConfig();
    
    console.log('📋 Current Configuration:');
    console.log(`Database Type: ${config.type}`);
    
    if (config.type === 'supabase' && config.supabase) {
      console.log('✅ Supabase configuration found');
      console.log(`URL: ${config.supabase.url}`);
      console.log(`Anon Key: ${config.supabase.anonKey.substring(0, 20)}...`);
      
      // Test connection
      console.log('\n🔌 Testing Supabase connection...');
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(config.supabase.url, config.supabase.anonKey);
      
      const { data, error } = await client
        .from('questions')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
        process.exit(1);
      }
      
      console.log('✅ Supabase connection successful');
      console.log(`Current questions in database: ${data?.[0]?.count || 0}`);
      
    } else {
      console.log('⚠️ Supabase not configured');
      console.log('To use Supabase:');
      console.log('1. Set DATABASE_TYPE=supabase');
      console.log('2. Set SUPABASE_URL and SUPABASE_ANON_KEY');
      console.log('3. Create the questions table in your Supabase project');
      process.exit(1);
    }
    
    console.log('\n🎉 Setup verification complete!');
    console.log('You can now run: pnpm run migrate:sqlite-to-supabase');
    
  } catch (error) {
    console.error('❌ Setup verification failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifySupabaseSetup().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}

export { verifySupabaseSetup }; 