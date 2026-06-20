const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Barani Database Sync Service',
  script: path.join(__dirname, 'sync.js')
});

// Listen for the "uninstall" event, which indicates the service is deleted.
svc.on('uninstall', function() {
  console.log('Uninstallation complete.');
  console.log('The service has been successfully removed from this system.');
});

// Stop and uninstall the service
svc.uninstall();
