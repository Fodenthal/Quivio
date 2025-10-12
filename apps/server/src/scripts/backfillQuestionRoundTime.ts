import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getDatabaseConfig, getGameConfig, isUsingSupabase } from '../config';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function backfillRoundTime() {
  if (!isUsingSupabase()) {
    console.log('ℹ️ Supabase is not configured as the question store. Nothing to backfill.');
    return;
  }

  const dbConfig = getDatabaseConfig();
  if (dbConfig.type !== 'supabase' || !dbConfig.supabase) {
    console.error('❌ Supabase configuration is missing required credentials.');
    process.exit(1);
  }

  const { url, serviceRoleKey, anonKey } = dbConfig.supabase;
  const apiKey = serviceRoleKey || anonKey;
  if (!url || !apiKey) {
    console.error('❌ Supabase URL or API key is not defined.');
    process.exit(1);
  }

  const client = createClient(url, apiKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const gameConfig = getGameConfig();
  const fallbackSeconds = Number(process.env.BACKFILL_ROUND_TIME_SECONDS ?? gameConfig.defaultRoundTime ?? 20);
  const fallbackMs = Math.max(1, Math.round(fallbackSeconds * 1000));

  console.log('🛠️ Backfilling question round times...');
  console.log(`   • Target round_time_ms: ${fallbackMs} (derived from ${fallbackSeconds}s)`);

  try {
    const { data, error } = await client
      .from('questions')
      .update({ round_time_ms: fallbackMs })
      .is('round_time_ms', null)
      .select('id');

    if (error) {
      throw error;
    }

    console.log(`✅ Updated ${data?.length ?? 0} question records with round_time_ms.`);

    const { data: stagingData, error: stagingError } = await client
      .from('questions_staging')
      .update({ round_time_ms: fallbackMs })
      .is('round_time_ms', null)
      .select('id');

    if (stagingError) {
      throw stagingError;
    }

    console.log(`✅ Updated ${stagingData?.length ?? 0} staging submissions with round_time_ms.`);
  } catch (error) {
    console.error('❌ Failed to backfill question round times:', error);
    process.exit(1);
  }
}

backfillRoundTime();
