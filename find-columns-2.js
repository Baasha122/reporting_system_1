const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zyvopqvtdverqcqjjyct.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dm9wcXZ0ZHZlcnFjcWpqeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODYwMzQsImV4cCI6MjA5NjQ2MjAzNH0.mpm9-6OX2uZRiZMdEFZPF4hCq2bgeztu4M0eGIIO8nE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testColumn(colName) {
  const payload = {};
  payload[colName] = 'test';
  const { error } = await supabase.from('projects').insert([payload]);
  if (error && error.code === 'PGRST204') {
    return false; 
  }
  return true; 
}

async function run() {
  console.log("Starting column brute-force search 2...");
  const candidates = [
    'project name', 'Project Name', 'project_Name', 'Project_Name', 'Project_name', 'projectName',
    'client name', 'Client Name', 'client_Name', 'Client_Name', 'Client_name', 'clientName',
    'Status', 'STATUS'
  ];
  
  for (const col of candidates) {
    if (await testColumn(col)) {
      console.log('FOUND COLUMN:', col);
    }
  }
  console.log("Search complete.");
}

run();
