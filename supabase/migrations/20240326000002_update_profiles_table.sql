-- Create the handle_updated_at() function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update profiles table with missing columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS role text DEFAULT 'employee',
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Add RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile"
            ON public.profiles FOR SELECT
            USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile"
            ON public.profiles FOR UPDATE
            USING (auth.uid() = id);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(id); 