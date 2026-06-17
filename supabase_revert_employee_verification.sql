-- 1. Drop the policy
DROP POLICY IF EXISTS "HODs can update profiles in their department" ON profiles;

-- 2. Restore the original handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, employee_id, name, email, department, designation, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'employee_id', 'EMP' || floor(random() * 10000)::text),
    COALESCE(new.raw_user_meta_data->>'name', 'New Employee'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'department', 'Engineering'),
    COALESCE(new.raw_user_meta_data->>'designation', 'Software Engineer'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'employee'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Remove the status column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS status;
