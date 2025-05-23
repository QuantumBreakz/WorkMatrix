-- Update users table to include all necessary fields
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Update activity_logs table to match Background-App schema
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ NOT NULL,
    cpu_percent FLOAT,
    memory_percent FLOAT,
    active_window TEXT,
    elapsed_seconds INTEGER,
    idle_seconds INTEGER,
    break_seconds INTEGER,
    mouse_moves INTEGER,
    keystrokes INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Update daily_hours table to match Background-App schema
CREATE TABLE IF NOT EXISTS public.daily_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    date DATE NOT NULL,
    total_hours FLOAT,
    idle_hours FLOAT,
    break_hours FLOAT,
    productive_hours FLOAT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Update screenshots table to match Background-App schema
CREATE TABLE IF NOT EXISTS public.screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    size BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table for user preferences
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    screenshot_interval INTEGER NOT NULL DEFAULT 300,
    sync_interval INTEGER NOT NULL DEFAULT 1800,
    max_storage_mb INTEGER NOT NULL DEFAULT 450,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create app_usage table for tracking application usage
CREATE TABLE IF NOT EXISTS public.app_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    app_name TEXT NOT NULL,
    window_title TEXT,
    duration INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_hours_user_id ON daily_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_hours_date ON daily_hours(date);
CREATE INDEX IF NOT EXISTS idx_screenshots_user_id ON screenshots(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_timestamp ON screenshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_app_usage_user_id ON app_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_app_usage_timestamp ON app_usage(timestamp);

-- Enable RLS on all tables
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activity_logs
CREATE POLICY "Users can view own activity logs"
    ON activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for daily_hours
CREATE POLICY "Users can view own daily hours"
    ON daily_hours FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily hours"
    ON daily_hours FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for screenshots
CREATE POLICY "Users can view own screenshots"
    ON screenshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screenshots"
    ON screenshots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for settings
CREATE POLICY "Users can view own settings"
    ON settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for app_usage
CREATE POLICY "Users can view own app usage"
    ON app_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own app usage"
    ON app_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for screenshots if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for screenshots
CREATE POLICY "Users can upload their own screenshots"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'screenshots' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own screenshots"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'screenshots' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Admins can view all screenshots"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'screenshots' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    ); 