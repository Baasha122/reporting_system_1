import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zyvopqvtdverqcqjjyct.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dm9wcXZ0ZHZlcnFjcWpqeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODYwMzQsImV4cCI6MjA5NjQ2MjAzNH0.mpm9-6OX2uZRiZMdEFZPF4hCq2bgeztu4M0eGIIO8nE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Profiles:', data);
  console.log('Error:', error);
}

check();
