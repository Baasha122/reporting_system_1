import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zyvopqvtdverqcqjjyct.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dm9wcXZ0ZHZlcnFjcWpqeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODYwMzQsImV4cCI6MjA5NjQ2MjAzNH0.mpm9-6OX2uZRiZMdEFZPF4hCq2bgeztu4M0eGIIO8nE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStatus(statusValue) {
  const { error } = await supabase.from('projects').insert([
    {
      projectid: `TEST-${Date.now()}`,
      projectname: 'Test',
      customername: 'Customer',
      department: 'Machine shop',
      status: statusValue,
    }
  ]);
  
  if (!error) {
    console.log(`✅ SUCCESS: ${statusValue}`);
    return true;
  }
  console.log(`❌ Failed: ${statusValue} - ${error.message}`);
  return false;
}

async function run() {
  await testStatus('Completed');
  await testStatus('completed');
  await testStatus('Done');
}

run();
