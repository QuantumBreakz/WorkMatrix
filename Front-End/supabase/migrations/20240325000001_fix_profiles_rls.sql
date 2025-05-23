-- Add RLS policy to allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Add RLS policy to allow the trigger function to create profiles
CREATE POLICY "handle_new_user can create profiles" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- Ensure the handle_new_user function has the necessary permissions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER; 