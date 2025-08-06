# Database Migration Guide

This guide covers migrating from SQLite to Supabase for the Quivio trivia game server.

## Prerequisites

1. **Supabase Project Setup**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Note your project URL and anon key
   - Ensure you have the `questions` table created with the following schema:

```sql
CREATE TABLE questions (
  id BIGSERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  question TEXT NOT NULL UNIQUE,
  correct_answer TEXT NOT NULL,
  acceptable_answers TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_count INTEGER DEFAULT 0
);

-- Indexes (already created)
CREATE INDEX idx_topic_difficulty ON questions(topic, difficulty);
CREATE INDEX idx_created_at ON questions(created_at);
CREATE UNIQUE INDEX idx_unique_question ON questions(question);
```

2. **Environment Variables**
   - Set up your `.env` file with Supabase credentials:
   ```env
   DATABASE_TYPE=supabase
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Migration Process

### Step 1: Backup Current Data
```bash
# Create a backup of your current SQLite database
cp questions.db questions.db.backup
```

### Step 2: Run Migration
```bash
# Install dependencies if not already done
pnpm install

# Run the migration script
pnpm run migrate:sqlite-to-supabase
```

### Step 3: Verify Migration
```bash
# Run tests to ensure everything works
pnpm test

# Check migration status
pnpm run migrate:status
```

## Migration Script Details

The migration script (`migrate_sqlite_to_supabase.ts`) performs the following:

1. **Connects to both databases** (SQLite source, Supabase destination)
2. **Validates data integrity** before migration
3. **Transfers all questions** with proper data transformation
4. **Preserves usage statistics** (used_count)
5. **Handles conflicts** (duplicate questions)
6. **Provides detailed logging** of the migration process

## Rollback Process

If you need to rollback to SQLite:

1. **Update environment variables:**
   ```env
   DATABASE_TYPE=sqlite
   ```

2. **Restore from backup:**
   ```bash
   cp questions.db.backup questions.db
   ```

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify Supabase URL and anon key
   - Check network connectivity
   - Ensure Supabase project is active

2. **Data Type Mismatches**
   - The migration script handles SQLite to PostgreSQL type conversions
   - JSON strings are properly escaped
   - Timestamps are converted to UTC

3. **Duplicate Questions**
   - Migration script skips duplicates based on question text
   - Check logs for skipped questions

### Getting Help

- Check the migration logs for detailed error information
- Verify your Supabase project settings
- Ensure all environment variables are correctly set

## Performance Considerations

- Migration processes data in batches for better performance
- Large datasets may take several minutes to migrate
- Consider running during low-traffic periods
- Monitor Supabase usage during migration

## Post-Migration

After successful migration:

1. **Test the application** thoroughly
2. **Monitor performance** with the new database
3. **Update deployment configurations** to use Supabase
4. **Consider removing SQLite dependencies** if no longer needed 