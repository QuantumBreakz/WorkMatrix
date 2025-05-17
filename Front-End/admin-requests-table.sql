-- Create admin_requests table for admin approval system
CREATE TABLE IF NOT EXISTS public.admin_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_requests_user_id ON public.admin_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON public.admin_requests(status);

-- Enable Row Level Security
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own requests" ON public.admin_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all requests" ON public.admin_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid() AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update requests" ON public.admin_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid() AND users.role = 'super_admin'
    )
  );
