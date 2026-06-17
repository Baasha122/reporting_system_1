-- 1. Add the status column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Update the handle_new_user trigger to set status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role user_role;
  v_status TEXT;
BEGIN
  v_role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'employee'::user_role);
  
  -- Automatically approve HODs, pending for employees
  IF v_role = 'hod' THEN
    v_status := 'approved';
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO public.profiles (id, employee_id, name, email, department, designation, role, status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'employee_id', 'EMP' || floor(random() * 10000)::text),
    COALESCE(new.raw_user_meta_data->>'name', 'New Employee'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'department', 'Engineering'),
    COALESCE(new.raw_user_meta_data->>'designation', 'Software Engineer'),
    v_role,
    v_status
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add RLS policy for HODs to update profiles in their department
CREATE POLICY "HODs can update profiles in their department" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles AS h 
      WHERE h.id = auth.uid() 
      AND h.role = 'hod' 
      AND h.department = profiles.department
    )
  );

-- Note: Ensure you have already run the existing schema file `supabase_schema.sql` 
-- before running this migration. If you haven't, please run `supabase_schema.sql` first.
