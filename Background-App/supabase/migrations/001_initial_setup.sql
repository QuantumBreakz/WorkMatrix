-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create screenshots table
CREATE TABLE screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    filename TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    size INTEGER NOT NULL
);

-- Create activity_logs table
CREATE TABLE activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create daily_hours table
CREATE TABLE daily_hours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    date DATE NOT NULL,
    total_hours FLOAT,
    idle_hours FLOAT,
    break_hours FLOAT,
    productive_hours FLOAT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Create screenshots bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true);

-- Create public read policy for screenshots
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'screenshots');

-- Create indexes for better query performance
CREATE INDEX idx_screenshots_user_id ON screenshots(user_id);
CREATE INDEX idx_screenshots_timestamp ON screenshots(timestamp);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_daily_hours_user_id ON daily_hours(user_id);
CREATE INDEX idx_daily_hours_date ON daily_hours(date);

-- Set up RLS policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;

-- Activity logs policies
CREATE POLICY "Users can view own activity logs"
    ON activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
    ON activity_logs FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Daily hours policies
CREATE POLICY "Users can view own daily hours"
    ON daily_hours FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily hours"
    ON daily_hours FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Screenshots policies
CREATE POLICY "Users can view own screenshots"
    ON screenshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all screenshots"
    ON screenshots FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create approval requests table
CREATE TABLE approval_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    screenshot_id UUID REFERENCES screenshots(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Approval requests policies
CREATE POLICY "Users can view own approval requests"
    ON approval_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all approval requests"
    ON approval_requests FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Set up storage policies
CREATE POLICY "Users can view own screenshots"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'screenshots' AND auth.uid() = owner);

CREATE POLICY "Admins can view all screenshots"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'screenshots' AND auth.jwt() ->> 'role' = 'admin'); 