-- Drop only the user-related tables if they exist
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- Create employees table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    department TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create admins table
CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    department TEXT,
    phone TEXT,
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Employees RLS
CREATE POLICY "Employees: Select own" ON public.employees
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Employees: Insert own" ON public.employees
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Employees: Update own" ON public.employees
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Employees: Delete own" ON public.employees
    FOR DELETE USING (auth.uid() = id);

-- Admins RLS
CREATE POLICY "Admins: Select own" ON public.admins
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins: Insert own" ON public.admins
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins: Update own" ON public.admins
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins: Delete own" ON public.admins
    FOR DELETE USING (auth.uid() = id); 