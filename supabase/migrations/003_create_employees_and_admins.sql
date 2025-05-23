-- Drop the old users table if it exists
DROP TABLE IF EXISTS public.users CASCADE;

-- Employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    full_name text,
    role text DEFAULT 'employee',
    department text,
    phone text,
    created_at timestamp with time zone DEFAULT now()
);

-- Admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    full_name text,
    role text DEFAULT 'admin',
    department text,
    phone text,
    approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- RLS: Only allow users to select/insert/update their own records
CREATE POLICY "Employees: Only self" ON public.employees
  FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Admins: Only self" ON public.admins
  FOR ALL USING (auth.uid()::text = id::text); 