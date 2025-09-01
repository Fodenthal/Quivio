-- Enhanced profiles table with age verification fields
-- Run this if you want age data in the profiles table too

-- 1. Add age verification columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS birth_year INTEGER,
ADD COLUMN IF NOT EXISTS is_age_verified BOOLEAN DEFAULT false;

-- 2. Update the trigger to copy user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    birth_year, 
    is_age_verified
  )
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'birth_year')::INTEGER,
    COALESCE((NEW.raw_user_meta_data->>'is_age_verified')::BOOLEAN, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update existing profiles with age data (optional)
UPDATE profiles 
SET 
  birth_year = (
    SELECT (user_metadata->>'birth_year')::INTEGER 
    FROM auth.users 
    WHERE auth.users.id = profiles.id
  ),
  is_age_verified = (
    SELECT COALESCE((user_metadata->>'is_age_verified')::BOOLEAN, false)
    FROM auth.users 
    WHERE auth.users.id = profiles.id
  )
WHERE birth_year IS NULL;
