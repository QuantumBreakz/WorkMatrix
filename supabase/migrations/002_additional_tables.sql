-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Breaks table
CREATE TABLE IF NOT EXISTS public.breaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- App Usage table
CREATE TABLE IF NOT EXISTS public.app_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    app_name TEXT NOT NULL,
    window_title TEXT,
    duration INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media Counts table
CREATE TABLE IF NOT EXISTS public.media_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    media_type TEXT NOT NULL, -- 'screenshot' or 'recording'
    count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_counts ENABLE ROW LEVEL SECURITY;

-- Projects: allow all users to select
CREATE POLICY "Select all projects" ON public.projects FOR SELECT USING (true);

-- Tasks: only owner can select/insert/update
CREATE POLICY "User can select own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);

-- Breaks: only owner can select/insert
CREATE POLICY "User can select own breaks" ON public.breaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can insert own breaks" ON public.breaks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- App Usage: only owner can select/insert
CREATE POLICY "User can select own app usage" ON public.app_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can insert own app usage" ON public.app_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Media Counts: only owner can select/insert/update
CREATE POLICY "User can select own media counts" ON public.media_counts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can insert own media counts" ON public.media_counts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update own media counts" ON public.media_counts FOR UPDATE USING (auth.uid() = user_id); 