-- Additional RLS policies for users table
CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Additional RLS policies for admin_requests table
CREATE POLICY "Admins can update admin requests" ON public.admin_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Additional RLS policies for time_logs table
CREATE POLICY "Users can insert their own time logs" ON public.time_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time logs" ON public.time_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any time log" ON public.time_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Additional RLS policies for tickets table
CREATE POLICY "Users can insert their own tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON public.tickets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any ticket" ON public.tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON public.time_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON public.admin_requests(status); 