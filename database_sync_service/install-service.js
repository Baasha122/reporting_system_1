const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Barani Database Sync Service',
  description: 'Syncs and archives daily task reports from Supabase to local SQL Server (SSMS)',
  script: path.join(__dirname, 'sync.js'),
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    }
  ]
});

// Listen for the "install" event, which indicates the service is installed.
svc.on('install', function() {
  console.log('Installing and starting "Barani Database Sync Service"...');
  svc.start();
  console.log('Service started successfully!');
});

// Handle error
svc.on('alreadyinstalled', function() {
  console.log('Service is already installed.');
});

svc.on('invalidinstallation', function() {
  console.log('Invalid service installation.');
});

svc.install();
