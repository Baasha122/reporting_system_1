-- Delete the profiles for EL018, EL019, and EL020
DELETE FROM public.profiles 
WHERE employee_id IN ('EL018', 'EL019', 'EL020');

-- Note: Because Supabase Authentication manages the actual login credentials,
-- you will ALSO need to delete these users from the "Authentication -> Users"
-- tab in your Supabase Dashboard to completely remove them.
