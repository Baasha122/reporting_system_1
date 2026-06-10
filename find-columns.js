const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zyvopqvtdverqcqjjyct.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dm9wcXZ0ZHZlcnFjcWpqeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODYwMzQsImV4cCI6MjA5NjQ2MjAzNH0.mpm9-6OX2uZRiZMdEFZPF4hCq2bgeztu4M0eGIIO8nE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testColumn(colName) {
  const payload = {};
  payload[colName] = 'test';
  const { error } = await supabase.from('projects').insert([payload]);
  if (error && error.code === 'PGRST204') {
    return false; // Column doesn't exist
  }
  // If we get an RLS error or anything else, the column exists!
  return true; 
}

async function run() {
  console.log("Starting column brute-force search...");
  const candidates = [
    'projectID', 'project_id', 'project_ID', 'projectid', 'project id',
    'client_name', 'customer_name', 'client', 'customer', 'clientname', 'customername',
    'date_time', 'date', 'created_at', 'time', 'datetime', 'date & time', 'date_and_time',
    'emp_id', 'employee_id', 'empid', 'empID',
    'status', 'project_status',
    'project_name', 'projectname', 'name'
  ];
  
  for (const col of candidates) {
    if (await testColumn(col)) {
      console.log('FOUND COLUMN:', col);
    }
  }
  console.log("Search complete.");
}

run();
