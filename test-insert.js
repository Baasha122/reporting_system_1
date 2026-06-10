const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zyvopqvtdverqcqjjyct.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dm9wcXZ0ZHZlcnFjcWpqeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODYwMzQsImV4cCI6MjA5NjQ2MjAzNH0.mpm9-6OX2uZRiZMdEFZPF4hCq2bgeztu4M0eGIIO8nE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('projects').insert([
    {
      project_ID: 'PRJ-999',
      Project_Name: 'Test from script',
      Status: 'onGoing'
    }
  ]);
  
  if (error) {
    console.error("Supabase Error Details:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Inserted data:", data);
  }
}

test();
