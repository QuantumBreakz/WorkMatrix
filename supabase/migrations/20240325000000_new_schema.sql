-- Set proper role
SET ROLE postgres;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.keystrokes CASCADE;
DROP TABLE IF EXISTS public.screenshots CASCADE;
DROP TABLE IF EXISTS public.time_logs CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.daily_hours CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.app_usage CASCADE;

-- Create new schema
-- Authentication and Users
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'employee', 'manager')) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles OWNER TO postgres;

-- Organizations and Teams
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations OWNER TO postgres;

CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teams OWNER TO postgres;

-- Projects and Tasks
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects OWNER TO postgres;

CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects NOT NULL,
    assigned_to UUID REFERENCES public.profiles,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks OWNER TO postgres;

-- Time Tracking
CREATE TABLE public.time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles NOT NULL,
    task_id UUID REFERENCES public.tasks,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.time_entries OWNER TO postgres;

-- Monitoring Data
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles NOT NULL,
    time_entry_id UUID REFERENCES public.time_entries,
    app_name TEXT NOT NULL,
    window_title TEXT,
    activity_type TEXT NOT NULL,
    keystroke_count INTEGER DEFAULT 0,
    mouse_events INTEGER DEFAULT 0,
    idle_time INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs OWNER TO postgres;

CREATE TABLE public.screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles NOT NULL,
    time_entry_id UUID REFERENCES public.time_entries,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.screenshots OWNER TO postgres;

-- Leave Management
CREATE TABLE public.leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leave_types OWNER TO postgres;

CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles NOT NULL,
    leave_type_id UUID REFERENCES public.leave_types NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leave_requests OWNER TO postgres;

-- Create indexes for better performance
CREATE INDEX idx_time_entries_user ON public.time_entries(user_id);
CREATE INDEX idx_time_entries_task ON public.time_entries(task_id);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_time_entry ON public.activity_logs(time_entry_id);
CREATE INDEX idx_screenshots_user ON public.screenshots(user_id);
CREATE INDEX idx_screenshots_time_entry ON public.screenshots(time_entry_id);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_leave_requests_user ON public.leave_requests(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create RLS Policies
-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Organizations: Admins can manage, everyone can view their own org
CREATE POLICY "Users can view their organization" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage organizations" ON public.organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Teams: Members can view their teams
CREATE POLICY "Users can view their teams" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage teams" ON public.teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Projects: Team members can view their projects
CREATE POLICY "Users can view their projects" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Admins and managers can manage projects" ON public.projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Tasks: Users can view assigned tasks
CREATE POLICY "Users can view assigned tasks" ON public.tasks
    FOR SELECT USING (
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can manage tasks" ON public.tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Time entries: Users can manage their own entries
CREATE POLICY "Users can manage their time entries" ON public.time_entries
    FOR ALL USING (user_id = auth.uid());

-- Activity logs: Users can manage their own logs
CREATE POLICY "Users can manage their activity logs" ON public.activity_logs
    FOR ALL USING (user_id = auth.uid());

-- Screenshots: Users can manage their own screenshots
CREATE POLICY "Users can manage their screenshots" ON public.screenshots
    FOR ALL USING (user_id = auth.uid());

-- Leave requests: Users can manage their own requests
CREATE POLICY "Users can manage their leave requests" ON public.leave_requests
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins and managers can view all leave requests" ON public.leave_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Create functions for common operations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (new.id, new.email, 'employee', new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Trigger for new user creation (with IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END
$$;

-- Grant usage on uuid-ossp functions
GRANT USAGE ON SCHEMA extensions TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres; 