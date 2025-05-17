-- Create function to initialize screenshots table
CREATE OR REPLACE FUNCTION create_screenshots_table()
RETURNS void AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS public.screenshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename TEXT NOT NULL,
        path TEXT NOT NULL,
        size BIGINT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Add RLS policies
    ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
    
    -- Create policy to allow users to see only their own screenshots
    CREATE POLICY "Users can view their own screenshots"
        ON public.screenshots FOR SELECT
        USING (auth.uid() = user_id);
        
    -- Create policy to allow users to insert their own screenshots
    CREATE POLICY "Users can insert their own screenshots"
        ON public.screenshots FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END;
$$ LANGUAGE plpgsql;

-- Create function to initialize activity_logs table
CREATE OR REPLACE FUNCTION create_activity_logs_table()
RETURNS void AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS public.activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        mouse_moves INTEGER NOT NULL DEFAULT 0,
        keystrokes INTEGER NOT NULL DEFAULT 0,
        active_window TEXT,
        cpu_percent FLOAT NOT NULL DEFAULT 0,
        memory_percent FLOAT NOT NULL DEFAULT 0,
        is_idle BOOLEAN NOT NULL DEFAULT false,
        is_break BOOLEAN NOT NULL DEFAULT false,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Add RLS policies
    ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
    
    -- Create policy to allow users to see only their own activity logs
    CREATE POLICY "Users can view their own activity logs"
        ON public.activity_logs FOR SELECT
        USING (auth.uid() = user_id);
        
    -- Create policy to allow users to insert their own activity logs
    CREATE POLICY "Users can insert their own activity logs"
        ON public.activity_logs FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END;
$$ LANGUAGE plpgsql;

-- Create function to initialize settings table
CREATE OR REPLACE FUNCTION create_settings_table()
RETURNS void AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS public.settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) UNIQUE,
        screenshot_interval INTEGER NOT NULL DEFAULT 300,
        sync_interval INTEGER NOT NULL DEFAULT 1800,
        max_storage_mb INTEGER NOT NULL DEFAULT 450,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Add RLS policies
    ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policy to allow users to see only their own settings
    CREATE POLICY "Users can view their own settings"
        ON public.settings FOR SELECT
        USING (auth.uid() = user_id);
        
    -- Create policy to allow users to update their own settings
    CREATE POLICY "Users can update their own settings"
        ON public.settings FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
        
    -- Create policy to allow users to insert their own settings
    CREATE POLICY "Users can insert their own settings"
        ON public.settings FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END;
$$ LANGUAGE plpgsql; 