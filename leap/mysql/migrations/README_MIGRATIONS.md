# Database Migrations Guide

This guide explains how to run database migrations for the LEAP project.

## Migration Files Location
All migration files are located in: `mysql/migrations/`

## Running Migrations

### Option 1: Using Docker (Recommended)

**For Windows PowerShell:**
```powershell
# Navigate to project root
cd "C:\Users\Ayush Agarwal\OneDrive\Jobs\UoG - Project LEAP\LEAP_V1.1"

# Run the migration using docker exec
Get-Content mysql/migrations/004_add_announcements.sql | docker exec -i mysql-leap mysql -uleap_user -pZs19981030. leap_db
```

**For Windows Command Prompt (CMD):**
```cmd
cd "C:\Users\Ayush Agarwal\OneDrive\Jobs\UoG - Project LEAP\LEAP_V1.1"
docker exec -i mysql-leap mysql -uleap_user -pZs19981030. leap_db < mysql/migrations/004_add_announcements.sql
```

**For Linux/Mac:**
```bash
cd /path/to/LEAP_V1.1
docker exec -i mysql-leap mysql -uleap_user -pZs19981030. leap_db < mysql/migrations/004_add_announcements.sql
```

### Option 2: Using MySQL Command Line Directly

If you have MySQL installed locally and not using Docker:

**Windows PowerShell:**
```powershell
# Navigate to project root
cd "C:\Users\Ayush Agarwal\OneDrive\Jobs\UoG - Project LEAP\LEAP_V1.1"

# Connect to MySQL and run the migration
mysql -u leap_user -pZs19981030. leap_db -e "source mysql/migrations/004_add_announcements.sql"
```

**Or using MySQL interactive mode:**
```powershell
mysql -u leap_user -p leap_db
```
Then in MySQL prompt:
```sql
source mysql/migrations/004_add_announcements.sql
exit;
```

**Windows Command Prompt:**
```cmd
cd "C:\Users\Ayush Agarwal\OneDrive\Jobs\UoG - Project LEAP\LEAP_V1.1"
mysql -u leap_user -p leap_db < mysql/migrations/004_add_announcements.sql
```

### Option 3: Using MySQL Workbench or Other GUI Tools

1. Open MySQL Workbench (or your preferred MySQL GUI)
2. Connect to your database (leap_db)
3. Open the file: `mysql/migrations/004_add_announcements.sql`
4. Execute the SQL script

### Option 4: Copy-Paste SQL Commands

1. Open the migration file: `mysql/migrations/004_add_announcements.sql`
2. Copy the SQL content
3. Connect to your MySQL database:
   ```powershell
   docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db
   ```
4. Paste and execute the SQL commands

## Verifying the Migration

After running the migration, verify that the table was created:

**Using Docker:**
```powershell
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db -e "SHOW TABLES LIKE 'announcements';"
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db -e "DESCRIBE announcements;"
```

**Using MySQL directly:**
```powershell
mysql -u leap_user -pZs19981030. leap_db -e "SHOW TABLES LIKE 'announcements';"
mysql -u leap_user -pZs19981030. leap_db -e "DESCRIBE announcements;"
```

## Available Migrations

- `001_add_quiz_publishing.sql` - Adds quiz publishing fields to files table
- `002_add_quiz_attempts.sql` - Creates quiz_attempts table
- `003_add_quiz_versioning.sql` - Adds quiz versioning support
- `004_add_announcements.sql` - Creates announcements table

## Troubleshooting

### Error: "Table already exists"
If you see this error, the table may already exist. You can:
1. Check if the table exists: `SHOW TABLES LIKE 'announcements';`
2. If it exists, verify its structure matches the migration
3. If you need to recreate it, drop it first: `DROP TABLE IF EXISTS announcements;`

### Error: "Access denied"
- Verify your MySQL credentials in `server/env` file
- Check that the user `leap_user` has proper permissions
- Try connecting with root user first to grant permissions

### Error: "Cannot connect to MySQL"
- Verify Docker container is running: `docker ps`
- Check MySQL logs: `docker logs mysql-leap`
- Verify database name is correct: `leap_db`

## Notes

- Migrations are idempotent (safe to run multiple times) due to `CREATE TABLE IF NOT EXISTS`
- Always backup your database before running migrations in production
- Test migrations in a development environment first






