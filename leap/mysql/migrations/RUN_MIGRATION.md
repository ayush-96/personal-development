# Running Migration 004 from MySQL Command Line

## Method 1: Connect to MySQL via Docker Container

### Step 1: Connect to MySQL
Open your terminal/PowerShell and run:

```powershell
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db
```

Or if you prefer to enter password interactively:
```powershell
docker exec -it mysql-leap mysql -uleap_user -p leap_db
# Then enter password when prompted: Zs19981030.
```

### Step 2: Run the Migration

Once you're in the MySQL console, you have two options:

**Option A: Use SOURCE command (recommended)**
```sql
source /var/lib/mysql/../mysql/migrations/004_add_announcements.sql
```

However, if the file path doesn't work, use Option B.

**Option B: Copy and paste the SQL directly**

Copy the entire SQL from the migration file and paste it into the MySQL console:

```sql
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    isdeleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_announcements_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_created_by (created_by),
    INDEX idx_is_published (is_published),
    INDEX idx_isdeleted (isdeleted),
    INDEX idx_created_at (created_at)
);
```

### Step 3: Verify the Migration

After running the SQL, verify the table was created:

```sql
SHOW TABLES LIKE 'announcements';
```

You should see:
```
+---------------------------+
| Tables_in_leap_db         |
+---------------------------+
| announcements             |
+---------------------------+
```

Check the table structure:
```sql
DESCRIBE announcements;
```

Exit MySQL:
```sql
EXIT;
```

---

## Method 2: If MySQL is Installed Locally (Not Docker)

### Step 1: Connect to MySQL
```powershell
mysql -u leap_user -p leap_db
# Enter password when prompted: Zs19981030.
```

Or with password in command:
```powershell
mysql -u leap_user -pZs19981030. leap_db
```

### Step 2: Run the Migration

**Option A: Use SOURCE command**
```sql
source C:/Users/Ayush Agarwal/OneDrive/Jobs/UoG - Project LEAP/LEAP_V1.1/mysql/migrations/004_add_announcements.sql
```

**Option B: Copy and paste SQL directly**
Same as Method 1, Option B above.

### Step 3: Verify
Same verification steps as Method 1.

---

## Quick Copy-Paste SQL (All Methods)

If you just want to copy-paste directly into MySQL console:

```sql
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    isdeleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcements_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_created_by (created_by),
    INDEX idx_is_published (is_published),
    INDEX idx_isdeleted (isdeleted),
    INDEX idx_created_at (created_at)
);
```

Then verify:
```sql
SHOW TABLES LIKE 'announcements';
DESCRIBE announcements;
```






