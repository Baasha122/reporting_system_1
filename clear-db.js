const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zyvopqvtdverqcqjjyct.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dm9wcXZ0ZHZlcnFjcWpqeWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODYwMzQsImV4cCI6MjA5NjQ2MjAzNH0.mpm9-6OX2uZRiZMdEFZPF4hCq2bgeztu4M0eGIIO8nE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearData() {
  console.log('Starting to clear data...');

  try {
    // Login to bypass RLS
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mshod@barani.com',
      password: 'MS123_SECURE',
    });

    if (authError) {
      console.log('Login failed:', authError.message);
      return;
    }
    console.log('Logged in as:', authData.user.id);

    // Clear projects table
    console.log('Fetching records from "projects" table...');
    const { data: projectsData, error: projectsFetchError } = await supabase.from('projects').select('*');
    if (projectsFetchError) throw projectsFetchError;

    if (projectsData && projectsData.length > 0) {
      console.log(`Found ${projectsData.length} records in "projects". Deleting...`);
      for (const p of projectsData) {
        if (p.id) {
          await supabase.from('projects').delete().eq('id', p.id);
        } else if (p.projectid) {
          await supabase.from('projects').delete().eq('projectid', p.projectid);
        }
      }
      console.log('Cleared "projects" table.');
    } else {
      console.log('No records found in "projects" for this user.');
    }

    // Clear project table
    console.log('Fetching records from "project" table...');
    const { data: projectData, error: projectFetchError } = await supabase.from('project').select('*');
    if (projectFetchError) throw projectFetchError;

    if (projectData && projectData.length > 0) {
      console.log(`Found ${projectData.length} records in "project". Deleting...`);
      for (const p of projectData) {
        if (p.id) {
          await supabase.from('project').delete().eq('id', p.id);
        } else if (p.Project_Id) {
          await supabase.from('project').delete().eq('Project_Id', p.Project_Id);
        } else if (p.employee_ID) {
          await supabase.from('project').delete().eq('employee_ID', p.employee_ID);
        }
      }
      console.log('Cleared "project" table.');
    } else {
      console.log('No records found in "project" for this user.');
    }

    console.log('Data clearing complete!');
  } catch (err) {
    console.error('Error clearing data:', err);
  }
}

clearData();
