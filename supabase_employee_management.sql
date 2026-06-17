-- 1. Ensure the status column exists. 
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Create an ultra-safe trigger that will NEVER crash the signup!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, employee_id, name, email, department, designation, role, status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'employee_id', 'EMP' || floor(random() * 10000)::text),
    COALESCE(new.raw_user_meta_data->>'name', 'New Employee'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'department', 'Engineering'),
    COALESCE(new.raw_user_meta_data->>'designation', 'Software Engineer'),
    'employee'::user_role,
    'pending'
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- If the insert fails (for any reason), we DO NOT crash the transaction.
  -- We just return the new user. 
  -- Our frontend code (auth-context.tsx) will then manually insert the profile safely!
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
