-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    app_name text NOT NULL,
    window_title text,
    activity_type text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create app_usage table
CREATE TABLE IF NOT EXISTS public.app_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    total_active_time bigint DEFAULT 0,
    total_idle_time bigint DEFAULT 0,
    last_active timestamp with time zone DEFAULT timezone('utc'::text, now()),
    mouse_movements integer DEFAULT 0,
    keyboard_events integer DEFAULT 0,
    scroll_events integer DEFAULT 0,
    network_requests integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create screenshots table
CREATE TABLE IF NOT EXISTS public.screenshots (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    data text NOT NULL,
    captured_at timestamp with time zone NOT NULL,
    uploaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create videos table
CREATE TABLE IF NOT EXISTS public.videos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    data text NOT NULL,
    duration integer,
    captured_at timestamp with time zone NOT NULL,
    uploaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for activity_logs
CREATE POLICY "Users can view their own activity logs"
    ON public.activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for app_usage
CREATE POLICY "Users can view their own app usage"
    ON public.app_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own app usage"
    ON public.app_usage FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own app usage"
    ON public.app_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for screenshots
CREATE POLICY "Users can view their own screenshots"
    ON public.screenshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own screenshots"
    ON public.screenshots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for videos
CREATE POLICY "Users can view their own videos"
    ON public.videos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own videos"
    ON public.videos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for time_entries
CREATE POLICY "Users can view their own time entries"
    ON public.time_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time entries"
    ON public.time_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time entries"
    ON public.time_entries FOR UPDATE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON public.activity_logs(created_at);
CREATE INDEX IF NOT EXISTS app_usage_user_id_idx ON public.app_usage(user_id);
CREATE INDEX IF NOT EXISTS app_usage_last_active_idx ON public.app_usage(last_active);
CREATE INDEX IF NOT EXISTS screenshots_user_id_idx ON public.screenshots(user_id);
CREATE INDEX IF NOT EXISTS screenshots_captured_at_idx ON public.screenshots(captured_at);
CREATE INDEX IF NOT EXISTS videos_user_id_idx ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS videos_captured_at_idx ON public.videos(captured_at);
CREATE INDEX IF NOT EXISTS time_entries_user_id_idx ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS time_entries_start_time_idx ON public.time_entries(start_time);
CREATE INDEX IF NOT EXISTS time_entries_end_time_idx ON public.time_entries(end_time);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.activity_logs
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.app_usage
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.time_entries
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at(); 