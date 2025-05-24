-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can access admin dashboard" ON auth.users;

-- Create admin users with password using Supabase's built-in function
DO $$
DECLARE
  admin_email TEXT;
BEGIN
  -- Create admin users using Supabase's built-in function
  PERFORM auth.sign_up(
    'admin1@checkin.dev',
    'admin1234',
    '{"role": "admin"}'::jsonb
  );
  
  PERFORM auth.sign_up(
    'admin2@checkin.dev',
    'admin1234',
    '{"role": "admin"}'::jsonb
  );
END $$;

-- Create policy for admin dashboard
CREATE POLICY "Admins can access admin dashboard"
  ON auth.users
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));
