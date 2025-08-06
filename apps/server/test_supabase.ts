#!/usr/bin/env tsx

import "dotenv/config";
import { createClient } from '@supabase/supabase-js';

async function testSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const client = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test basic connection
    const { data, error } = await client
      .from('questions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('Sample data:', data?.[0] ? Object.keys(data[0]) : 'No data');
    
    if (data?.[0]) {
      console.log('Column names:', Object.keys(data[0]));
    }
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
  }
}

testSupabase(); 