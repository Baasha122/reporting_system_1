const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zyvopqvtdverqcqjjyct.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dm9wcXZ0ZHZlcnFjcWpqeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODYwMzQsImV4cCI6MjA5NjQ2MjAzNH0.mpm9-6OX2uZRiZMdEFZPF4hCq2bgeztu4M0eGIIO8nE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mshod@barani.com',
    password: 'MS123_SECURE',
  });

  if (authError) {
    console.log('Login failed:', authError.message);
    return;
  }

  console.log('Logged in as:', authData.user.id);
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
  console.log('Profile:', profile);

  // Try insert with 'onGoing'
  const p1 = {
    projectid: `TEST-${Date.now()}-1`,
    projectname: 'Test Project 1',
    customername: 'Test Customer',
    department: profile.department,
    status: 'onGoing',
  };
  const { error: e1 } = await supabase.from('projects').insert([p1]);
  console.log('Insert with onGoing error:', e1?.message || 'Success!');

  // Try insert with 'Ongoing'
  const p2 = {
    projectid: `TEST-${Date.now()}-2`,
    projectname: 'Test Project 2',
    customername: 'Test Customer',
    department: profile.department,
    status: 'Ongoing',
  };
  const { error: e2 } = await supabase.from('projects').insert([p2]);
  console.log('Insert with Ongoing error:', e2?.message || 'Success!');
  
  // Try insert with 'ONGOING'
  const p3 = {
    projectid: `TEST-${Date.now()}-3`,
    projectname: 'Test Project 3',
    customername: 'Test Customer',
    department: profile.department,
    status: 'ONGOING',
  };
  const { error: e3 } = await supabase.from('projects').insert([p3]);
  console.log('Insert with ONGOING error:', e3?.message || 'Success!');
}

test();
