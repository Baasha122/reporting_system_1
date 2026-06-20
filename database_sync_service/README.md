# Barani Database Sync & Archive Service

This is a Node.js-based background service configured to synchronize master tables (`profiles`, `projects`) and archive historical daily task data from **Supabase (Postgres Cloud)** to a local **SQL Server (SSMS)** database. It purges daily task entries older than **30 days** from the cloud database to help keep you well within the 1GB free storage limit of Supabase.

---

## Prerequisites

1. **Node.js** (v18 or higher) installed on the Windows machine.
2. **Microsoft SQL Server** (local instance, e.g. SQL Express) running with Windows Authentication.
3. **Supabase `service_role` key:** You must get this key from your Supabase Dashboard (`Settings -> API -> service_role key`). This administrative key is necessary because the sync service deletes archived tasks and needs to bypass Row-Level Security (RLS) policies.

---

## Setup Instructions

### Step 1: Create local tables in SSMS
1. Open **SQL Server Management Studio (SSMS)** and connect to your local database server.
2. Create a new database named `ReportingSystemArchive` (or another name of your choice).
3. Open a new query window, copy the contents of [create_local_tables.sql](create_local_tables.sql), and run it. This creates the matching SQL Server tables.

### Step 2: Install dependencies
Open your command prompt or PowerShell, navigate to the service directory, and install package dependencies:
```bash
cd d:\backup2\RN_Reporting_System\database_sync_service
npm install
```

### Step 3: Configure Environment Variables
Open the `.env` file in the service folder and set up your details:
* Specify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
* Set your SQL Server instance name in `SQL_SERVER_NAME` (e.g., `localhost\\SQLEXPRESS` or `localhost`).
* Set `SQL_DATABASE_NAME` to your archive database name.
* Adjust `SYNC_RETENTION_DAYS` (default `30` days) and `SYNC_INTERVAL_HOURS` (default `24` hours) if needed.

---

## Usage

### Run Manually (For Testing)
To verify everything works correctly and test the database connections, run the sync process manually:
```bash
npm start
```
This runs the sync task immediately and prints execution details to the console. It will also write logs to a local file named `sync.log`.

---

## Install as a Windows Background Service

To run this task continuously as a background Windows Service (even when you are logged out):

1. **Open command prompt / PowerShell as Administrator.**
2. Navigate to the service folder:
   ```bash
   cd d:\backup2\RN_Reporting_System\database_sync_service
   ```
3. Run the installation script:
   ```bash
   npm run service:install
   ```
   This registers the script as **`Barani Database Sync Service`** and starts it.

### Critical Node for Windows Authentication:
Windows Services run under the `Local System` account by default. To make sure the service can connect to your local SQL Server database using Windows Authentication:
1. Press `Win + R`, type `services.msc`, and press Enter to open the Windows Services panel.
2. Scroll down and locate **`Barani Database Sync Service`**.
3. Right-click on it and choose **Properties**.
4. Go to the **Log On** tab.
5. Choose **This account**, enter your Windows account username and password (the account you use to log in to Windows and run SSMS), and click **OK**.
6. Restart the service to apply the credentials.

---

## Uninstall Service

If you need to remove the service from your system:
1. Open command prompt / PowerShell as Administrator.
2. Run:
   ```bash
   npm run service:uninstall
   ```
This stops the service and unregisters it cleanly from Windows.
