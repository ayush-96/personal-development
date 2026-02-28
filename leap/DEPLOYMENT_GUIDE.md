# EC2 Deployment Guide for LEAP Project

This guide will help you deploy the LEAP project on an Amazon Linux 2 EC2 instance.

## Local Development vs EC2 Production

### Local Development Setup
When running locally, you typically use:
- **Client:** `cd client && npm run dev` - Runs Vite development server (usually on port 5173) with hot reload
- **Server:** `cd server && npm start` - Runs Express server directly (port 3002)

This setup uses two separate processes and the Vite dev server handles client development.

### EC2 Production Setup
On EC2, the architecture is different:

1. **Client (Frontend):**
   - **Build:** `cd client && npm run build` - Creates optimized static files in `client/dist` directory
   - **Serve:** Nginx serves these static files directly (no Node.js process needed for client)
   - **No dev server:** The built files are static HTML/CSS/JS served by nginx

2. **Server (Backend):**
   - **Run:** `pm2 start bin/www --name leap-server` - Express server runs via PM2 process manager (port 3002)
   - **Proxy:** Nginx forwards API requests (`/api/*`, `/user/*`, `/chat/*`, etc.) to the Node.js server

### Architecture Flow

**Local:**
```
Browser → Vite Dev Server (port 5173) → API calls → Express Server (port 3002)
```

**EC2 Production:**
```
Browser → Nginx (port 80) → Static files (client/dist)
                    ↓
              API requests → Express Server (port 3002) via PM2
```

### Key Differences

| Aspect | Local Development | EC2 Production |
|--------|------------------|----------------|
| **Client** | `npm run dev` (Vite dev server) | `npm run build` → Static files served by nginx |
| **Server** | `npm start` (direct) | `pm2 start` (process manager) |
| **Ports** | Client: 5173, Server: 3002 | Client: 80 (nginx), Server: 3002 (internal) |
| **Hot Reload** | Yes (Vite) | No (static files) |
| **Process Management** | Manual (two terminals) | PM2 (auto-restart, monitoring) |
| **Web Server** | Vite dev server | Nginx (production-grade) |

### Why This Setup?

- **Performance:** Static files served by nginx are faster than a Node.js dev server
- **Reliability:** PM2 ensures the server restarts automatically if it crashes
- **Security:** Server only accessible via nginx proxy, not directly from internet
- **Scalability:** Can easily add more server instances behind nginx
- **Production-ready:** Optimized builds, no dev dependencies, better caching

## Prerequisites
- EC2 instance with Amazon Linux 2
- nginx, node, pm2, docker installed
- GitHub repository cloned
- Security groups configured (ports 80, 443, 22, 3002)

## Step 1: Set Up MySQL Database

### Option A: Using Docker (Recommended)
```bash
# Navigate to project root
cd /path/to/LEAP_V1.1

# Start MySQL container
docker-compose up -d

# Verify MySQL is running
docker ps

# Check MySQL logs
docker logs mysql-leap
```

### Option B: Install MySQL Directly
```bash
# Install MySQL
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

In MySQL prompt:
```sql
CREATE DATABASE leap_db;
CREATE USER 'leap_user'@'localhost' IDENTIFIED BY 'Zs19981030.';
GRANT ALL PRIVILEGES ON leap_db.* TO 'leap_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 2: Install Dependencies

```bash
# Navigate to project root
cd /path/to/LEAP_V1.1

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## Step 3: Set Up Environment Variables

### Create Server Environment File
```bash
# Navigate to server directory
cd /path/to/LEAP_V1.1/server

# Create env file (note: the code expects './env' not '.env')
sudo nano env
```

Add the following content (adjust values as needed):
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=leap_user
DB_PASSWORD=Zs19981030.
DB_NAME=leap_db
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0

# Server Configuration
PORT=3002

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_KEY=your-openai-api-key
OPENAI_DEFAULT_MODEL=gpt-4o

# RAGFlow Configuration (if using)
RAGFLOW_API_KEY=your-ragflow-api-key
RAGFLOW_BASE_URL=http://localhost

# MinerU Configuration (if using)
MINERU_API_KEY=your-mineru-api-key
MINERU_BASE_URL=https://mineru.net/api/v4

# Storage Configuration
STORAGE_KEY_URL=http://your-ec2-public-ip:3002
```

**Important:** Replace `your-ec2-public-ip` with your actual EC2 instance's public IP or domain name.

## Step 4: Initialize Database (if needed)

If you have database initialization scripts:
```bash
cd /path/to/LEAP_V1.1

# If using Docker
docker exec -i mysql-leap mysql -uleap_user -pZs19981030. leap_db < mysql/init/init.sql

# If using local MySQL
mysql -uleap_user -pZs19981030. leap_db < mysql/init/init.sql
```

**Troubleshooting Database Initialization:**

If you get errors like "Failed to open the referenced table", try one of these:

**Option 1: Drop and recreate the database** (cleanest approach):
```bash
# If using Docker
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. -e "DROP DATABASE IF EXISTS leap_db; CREATE DATABASE leap_db;"
docker exec -i mysql-leap mysql -uleap_user -pZs19981030. leap_db < mysql/init/init.sql

# If using local MySQL
mysql -uleap_user -pZs19981030. -e "DROP DATABASE IF EXISTS leap_db; CREATE DATABASE leap_db;"
mysql -uleap_user -pZs19981030. leap_db < mysql/init/init.sql
```

**Option 2: Drop all tables first**:
```bash
# Connect to MySQL
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db

# Then run these SQL commands:
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS chat_assistants;
DROP TABLE IF EXISTS multiple_choice_question;
DROP TABLE IF EXISTS flashcards;
DROP TABLE IF EXISTS space_members;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS spaces;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;
EXIT;

# Then run init.sql again
docker exec -i mysql-leap mysql -uleap_user -pZs19981030. leap_db < mysql/init/init.sql
```

**Note:** The init.sql file has been updated to disable foreign key checks during table creation, which should prevent this error. If you're still seeing issues, use one of the cleanup methods above.

## Step 5: Build Client for Production

```bash
# Navigate to client directory
cd /path/to/LEAP_V1.1/client

# Ensure all dependencies are installed
npm install

# Build the production version
npm run build

# The build output will be in the 'dist' directory
```

## Step 6: Configure PM2 for Server

```bash
# Navigate to server directory
cd /path/to/LEAP_V1.1/server

# Start server with PM2
pm2 start bin/www --name leap-server

# Or create an ecosystem file for better management
pm2 ecosystem
```

Edit the generated `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'leap-server',
    script: './bin/www',
    cwd: '/path/to/LEAP_V1.1/server',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

Then start with:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 7: Configure Nginx

```bash
# Create nginx configuration
sudo nano /etc/nginx/conf.d/leap.conf
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com your-ec2-public-ip;

    # Serve static files from client build
    root /path/to/LEAP_V1.1/client/dist;
    index index.html;

    # Client routes - serve index.html for SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js server
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy other API routes
    location ~ ^/(chat|files|quiz|user|space) {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve static files from server
    location /public {
        proxy_pass http://localhost:3002;
    }

    # Increase upload size limit
    client_max_body_size 100M;
}
```

Test and reload nginx:
```bash
# Test nginx configuration (MUST use sudo)
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Or restart nginx
sudo systemctl restart nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

# Check nginx status
sudo systemctl status nginx
```

## Step 8: Set Up SSL (Optional but Recommended)

If you have a domain name, set up SSL with Let's Encrypt:
```bash
# Install certbot
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Step 9: Configure Firewall (EC2 Security Groups)

**For EC2 instances, use Security Groups instead of local firewall commands.**

### EC2 Security Group Configuration (Recommended)

1. **Go to AWS Console** → EC2 → Your Instance → Security Tab → Security Groups
2. **Edit Inbound Rules** and add:
   - **Type:** HTTP, **Port:** 80, **Source:** 0.0.0.0/0 (or restrict to specific IPs for better security)
   - **Type:** HTTPS, **Port:** 443, **Source:** 0.0.0.0/0 (or restrict to specific IPs)
   - **Type:** SSH, **Port:** 22, **Source:** Your IP address only (for security)
   - **Type:** Custom TCP, **Port:** 3002, **Source:** 127.0.0.1/32 (optional - only needed if accessing server directly without nginx)

**Note:** Port 3002 is optional since nginx will proxy requests. It's safer to only allow ports 80/443 from outside and keep 3002 accessible only from localhost (127.0.0.1) if needed.

### Local Firewall (Usually NOT Needed on EC2)

On EC2, AWS Security Groups handle firewall rules at the hypervisor level. Local firewall commands are typically **not necessary** and can sometimes conflict with security groups.

**You can skip this section** - Security Groups are sufficient for EC2.

## Step 10: Verify Deployment

```bash
# Check PM2 status
pm2 status
pm2 logs leap-server

# Check nginx status
sudo systemctl status nginx

# Check MySQL status (if using Docker)
docker ps

# Check MySQL status (if installed directly)
#sudo systemctl status mysqld

# Test server endpoint (note: there's no /health endpoint, test a real one)
# Option 1: Test login endpoint (will return error, but shows server is working)
curl -X POST http://localhost:3002/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Option 2: Just verify server is listening on port 3002
ss -tulpn | grep 3002
# or
netstat -tulpn | grep 3002

# Option 3: Test that Express is responding (use POST for login endpoint)
curl -X POST http://localhost:3002/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
# This will return an error message (invalid credentials), which confirms the server is running
```

## Step 11: Update Client API Configuration

If your client makes direct API calls, you may need to update the API base URL. Check `client/src/api/` files and ensure they use relative paths or the correct production URL.

## Useful Commands

### PM2 Commands
```bash
pm2 list                    # List all processes
pm2 logs leap-server        # View logs
pm2 restart leap-server     # Restart server
pm2 stop leap-server        # Stop server
pm2 delete leap-server      # Remove from PM2
pm2 monit                   # Monitor resources
```

### Docker Commands (for MySQL)
```bash
docker-compose up -d        # Start MySQL
docker-compose down         # Stop MySQL
docker-compose logs         # View logs
docker exec -it mysql-leap mysql -uleap_user -p leap_db  # Access MySQL
```

### Nginx Commands
```bash
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo nginx -t              # Test configuration
```

## Accessing MySQL Database

### Option A: Using Docker (Recommended)

**Connect to MySQL:**
```bash
# Interactive MySQL shell
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db
```

**Once connected, you can run SQL commands:**
```sql
-- Show all tables
SHOW TABLES;

-- View table structure
DESCRIBE users;
DESCRIBE spaces;
DESCRIBE files;
DESCRIBE chat_sessions;

-- View data from a table
SELECT * FROM users;
SELECT * FROM spaces;
SELECT * FROM files LIMIT 10;

-- Count records
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM spaces;

-- View specific columns
SELECT id, email, role, created_at FROM users;

-- Exit MySQL
EXIT;
```

**Run SQL commands directly from command line (non-interactive):**
```bash
# Show all tables
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db -e "SHOW TABLES;"

# View users table
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db -e "SELECT * FROM users;"

# Count records in each table
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db -e "SELECT 'users' as table_name, COUNT(*) as count FROM users UNION SELECT 'spaces', COUNT(*) FROM spaces UNION SELECT 'files', COUNT(*) FROM files;"
```

### Option B: Using Local MySQL Installation

**Connect to MySQL:**
```bash
# Interactive MySQL shell
mysql -uleap_user -pZs19981030. leap_db

# Or with password prompt (more secure)
mysql -uleap_user -p leap_db
# Enter password when prompted: Zs19981030.
```

**Once connected, use the same SQL commands as shown in Option A above.**

### Common MySQL Commands for Viewing Data

```sql
-- Show all databases
SHOW DATABASES;

-- Use a specific database
USE leap_db;

-- Show all tables in current database
SHOW TABLES;

-- Show table structure
DESCRIBE table_name;
-- or
SHOW COLUMNS FROM table_name;

-- View all data from a table
SELECT * FROM table_name;

-- View limited rows
SELECT * FROM table_name LIMIT 10;

-- View specific columns
SELECT column1, column2 FROM table_name;

-- Search/filter data
SELECT * FROM users WHERE email = 'user@example.com';
SELECT * FROM spaces WHERE name LIKE '%test%';

-- Count records
SELECT COUNT(*) FROM table_name;

-- View with ordering
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- Join tables
SELECT u.email, s.name as space_name 
FROM users u 
JOIN spaces s ON u.id = s.owner_id;

-- Exit MySQL
EXIT;
-- or
QUIT;
```

### Quick Reference: Database Credentials

- **Database Name:** `leap_db`
- **Username:** `leap_user`
- **Password:** `Zs19981030.`
- **Host:** `localhost` (or container name `mysql-leap` for Docker)
- **Port:** `3306`

### Viewing Database Tables and Data (Quick Examples)

```bash
# Docker: List all tables
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db -e "SHOW TABLES;"

# Docker: View users table
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db -e "SELECT * FROM users;"

# Docker: View spaces table
docker exec -it mysql-leap mysql -uleap_user -pZs19981030. leap_db -e "SELECT * FROM spaces;"

# Local MySQL: List all tables
mysql -uleap_user -pZs19981030. leap_db -e "SHOW TABLES;"

# Local MySQL: View users table
mysql -uleap_user -pZs19981030. leap_db -e "SELECT * FROM users;"
```

## Troubleshooting

### Server not starting
- Check PM2 logs: `pm2 logs leap-server`
- Verify environment variables are set correctly
- Check if port 3002 is available: `netstat -tulpn | grep 3002`
- Verify database connection

### Client not loading / Cannot access in browser

If curl works but browser doesn't, follow these steps:

**Step 1: Check if nginx is running**
```bash
sudo systemctl status nginx
# If not running, start it:
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Step 2: Verify nginx is listening on port 80**
```bash
sudo ss -tulpn | grep :80
# or
sudo netstat -tulpn | grep :80
# Should show nginx listening on port 80
```

**Step 3: Check nginx configuration**
```bash
# Test configuration syntax
sudo nginx -t

# View your nginx config
sudo cat /etc/nginx/conf.d/leap.conf
# or
sudo nano /etc/nginx/conf.d/leap.conf
```

**Step 4: Verify client build exists**
```bash
# Check if dist directory exists and has files
ls -la /path/to/LEAP_V1.1/client/dist
# Should show index.html and other built files

# If dist doesn't exist, build it:
cd /path/to/LEAP_V1.1/client
npm run build
```

**Step 5: Check nginx error logs**
```bash
# View recent errors
sudo tail -50 /var/log/nginx/error.log

# Follow errors in real-time
sudo tail -f /var/log/nginx/error.log
```

**Step 6: Check nginx access logs**
```bash
# See if requests are reaching nginx
sudo tail -f /var/log/nginx/access.log
# Then try accessing in browser and see if entries appear
```

**Step 7: Fix file permissions (CRITICAL for "Permission denied" errors)**
```bash
# Get the nginx user (usually 'nginx' on Amazon Linux)
NGINX_USER=$(ps aux | grep 'nginx: worker' | head -1 | awk '{print $1}')
echo "Nginx user: $NGINX_USER"

# Fix permissions - make directories readable and executable
sudo chmod -R 755 /home/ec2-user/leap/src/LEAP_V1.1/client/dist

# Option 1: Make files readable by all (quick fix)
sudo chmod -R 644 /home/ec2-user/leap/src/LEAP_V1.1/client/dist/*

# Option 2: Change ownership to nginx user (better for security)
sudo chown -R nginx:nginx /home/ec2-user/leap/src/LEAP_V1.1/client/dist

# Option 3: Add nginx user to ec2-user group and make group readable
sudo usermod -a -G ec2-user nginx
sudo chmod -R 750 /home/ec2-user/leap/src/LEAP_V1.1/client/dist
sudo chgrp -R ec2-user /home/ec2-user/leap/src/LEAP_V1.1/client/dist

# Verify permissions
ls -la /home/ec2-user/leap/src/LEAP_V1.1/client/dist | head -10
```

**Step 8: Test nginx directly**
```bash
# Test if nginx responds
curl http://localhost
curl http://54.218.131.212

# Test from outside (from your local machine)
curl http://54.218.131.212
```

**Step 9: Fix conflicting server name (CRITICAL for "conflicting server name" errors)**
```bash
# Check for default nginx configs
ls -la /etc/nginx/conf.d/
ls -la /etc/nginx/sites-enabled/ 2>/dev/null

# Look for default.conf or similar files
sudo cat /etc/nginx/conf.d/default.conf 2>/dev/null

# Disable default site (rename it)
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null

# Or if it's in sites-enabled
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null

# Make sure your leap.conf has a proper server_name
sudo nano /etc/nginx/conf.d/leap.conf
# Ensure it has: server_name 54.218.131.212; (or your domain)

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

**Step 10: Verify nginx configuration path**
```bash
# Check nginx main config
sudo cat /etc/nginx/nginx.conf

# Look for this line to see which configs are included:
# include /etc/nginx/conf.d/*.conf;
# or
# include /etc/nginx/sites-enabled/*;
```

**Common Issues and Solutions:**

1. **Nginx not running:**
   ```bash
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

2. **Client not built:**
   ```bash
   cd /path/to/LEAP_V1.1/client
   npm run build
   ```

3. **Wrong path in nginx config:**
   - Verify the `root` directive in `/etc/nginx/conf.d/leap.conf` points to the correct `client/dist` path
   - Use absolute path: `root /home/ec2-user/LEAP_V1.1/client/dist;`

4. **Permission denied:**
   ```bash
   sudo chmod -R 755 /path/to/LEAP_V1.1/client/dist
   ```

5. **Default nginx site taking precedence:**
   ```bash
   # Remove or rename default site
   sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **Nginx config syntax error:**
   ```bash
   sudo nginx -t  # Will show syntax errors
   # Fix errors, then reload
   sudo systemctl reload nginx
   ```

**Quick Diagnostic Commands:**
```bash
# Run all checks at once
echo "=== Nginx Status ===" && sudo systemctl status nginx --no-pager
echo "=== Port 80 Check ===" && sudo ss -tulpn | grep :80
echo "=== Nginx Config Test ===" && sudo nginx -t
echo "=== Client Build Check ===" && ls -la /path/to/LEAP_V1.1/client/dist | head -5
echo "=== Recent Nginx Errors ===" && sudo tail -10 /var/log/nginx/error.log
```

### Database connection issues
- Verify MySQL is running
- Check database credentials in `server/env` file
- Test connection: `mysql -uleap_user -p -h localhost leap_db`

### Permission issues
- Ensure nginx can read client/dist directory: `sudo chmod -R 755 /path/to/LEAP_V1.1/client/dist`
- Check file ownership: `sudo chown -R ec2-user:ec2-user /path/to/LEAP_V1.1`

## Security Recommendations

1. **Change default passwords** in the env file
2. **Use strong JWT_SECRET** (generate with: `openssl rand -base64 32`)
3. **Restrict database access** to localhost only
4. **Set up firewall rules** to limit access
5. **Use HTTPS** with SSL certificates
6. **Keep dependencies updated**: `npm audit fix`
7. **Set proper file permissions** for sensitive files

###################################################################################################
###################################################################################################
## After EC2 Restart
###################################################################################################
###################################################################################################
When you restart your EC2 instance, follow these steps to get your application running again:

### Step 1: Start MySQL Database

**If using Docker (Recommended):**
```bash
# Navigate to project root
cd /path/to/LEAP_V1.1

# Start MySQL container
docker-compose up -d

# Verify MySQL is running
docker ps

# Check MySQL logs if needed
docker logs mysql-leap
```

**If using local MySQL:**
```bash
# MySQL should auto-start if enabled, but verify:
sudo systemctl start mysqld
sudo systemctl status mysqld
```

### Step 2: Start PM2 Processes

PM2 should auto-start if you ran `pm2 startup` during initial setup, but verify and start if needed:

```bash
# Check PM2 status
pm2 list

# If processes are not running, start them
cd /path/to/LEAP_V1.1/server

# Option 1: If you have ecosystem.config.js file
pm2 start ecosystem.config.js

# Option 2: If ecosystem.config.js doesn't exist (use this simpler method)
pm2 start bin/www --name leap-server

# Save PM2 process list (if not already saved)
pm2 save

# If PM2 didn't auto-start, set it up again:
pm2 startup
# Follow the instructions it provides
```

**Note:** If you get an error that `ecosystem.config.js` is not found, use the simpler command: `pm2 start bin/www --name leap-server`

### Step 3: Verify Nginx is Running

Nginx should auto-start if enabled, but verify:

```bash
# Check nginx status
sudo systemctl status nginx

# If not running, start it
sudo systemctl start nginx

# Ensure it's enabled for auto-start (if not already)
sudo systemctl enable nginx
```

### Step 4: Verify Everything is Working

```bash
# Check PM2 processes
pm2 status
pm2 logs leap-server --lines 50

# Check nginx
sudo systemctl status nginx

# Check MySQL (Docker)
docker ps

# Check MySQL (local)
# sudo systemctl status mysqld

# Test server endpoint (login requires POST, not GET)
# Option 1: Test with POST request (will return error if credentials wrong, but confirms server is working)
curl -X POST http://localhost:3002/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Option 2: Just verify server is listening on port 3002 (simpler check)
ss -tulpn | grep 3002
# or
netstat -tulpn | grep 3002
```
###############################################
### Quick Restart Checklist

If everything was set up correctly with auto-start enabled, you should only need:

```bash
# 1. Start MySQL (Docker)
cd /path/to/LEAP_V1.1
docker-compose up -d

# 2. Verify PM2 is running (should auto-start)
pm2 list

# 3. Verify nginx is running (should auto-start)
sudo systemctl status nginx

# 4. If PM2 didn't start, run:
cd /path/to/LEAP_V1.1/server
pm2 start bin/www --name leap-server
```

### Troubleshooting After Restart

**If PM2 processes didn't auto-start:**
```bash
# Re-setup PM2 startup script
pm2 startup
# Copy and run the command it provides (usually requires sudo)

# Then save your PM2 processes
pm2 save
```

**If Docker containers didn't start:**
```bash
# Check Docker service
sudo systemctl status docker
sudo systemctl start docker

# Then start your containers
cd /path/to/LEAP_V1.1
docker-compose up -d
```

**If nginx didn't start:**
```bash
# Check for configuration errors
sudo nginx -t

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Update Public IP Address

If your EC2 instance gets a new public IP address (e.g., after stopping/starting the instance), you need to update it in the following places:

### Step 1: Update Server Environment File

```bash
# Navigate to server directory
cd /path/to/LEAP_V1.1/server

# Edit the env file
sudo nano env
```

Update the `STORAGE_KEY_URL` line with your new public IP:
```env
STORAGE_KEY_URL=http://YOUR-NEW-PUBLIC-IP:3002
```

**Or if you're using a domain name:**
```env
STORAGE_KEY_URL=http://your-domain.com:3002
```

**To get your current public IP:**
```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

### Step 2: Update Nginx Configuration

```bash
# Edit nginx configuration
sudo nano /etc/nginx/conf.d/leap.conf
```

Update the `server_name` directive:
```nginx
server_name your-domain.com YOUR-NEW-PUBLIC-IP;
```

**Or if you only use IP:**
```nginx
server_name YOUR-NEW-PUBLIC-IP;
```

### Step 3: Test and Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### Step 4: Restart PM2 Server

```bash
# Restart the server to pick up the new STORAGE_KEY_URL
pm2 restart leap-server

# Check logs to verify
pm2 logs leap-server --lines 20
```

### Quick IP Update Checklist

```bash
# 1. Get your new public IP
NEW_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "New IP: $NEW_IP"

# 2. Update server/env file
cd /path/to/LEAP_V1.1/server
sudo sed -i "s|STORAGE_KEY_URL=.*|STORAGE_KEY_URL=http://$NEW_IP:3002|" env

# 3. Update nginx config (if using IP in server_name)
sudo sed -i "s|server_name.*|server_name $NEW_IP;|" /etc/nginx/conf.d/leap.conf

# 4. Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

# 5. Restart PM2
pm2 restart leap-server
```

**Note:** If you're using an Elastic IP address, you won't need to update the IP after restarts. Consider assigning an Elastic IP to your EC2 instance to avoid this issue.

## Maintenance

### Update Application
```bash
cd /path/to/LEAP_V1.1
git pull origin main
cd server && npm install
cd ../client && npm install && npm run build
pm2 restart leap-server
sudo systemctl reload nginx
```

### Backup Database
```bash
# Using Docker
docker exec mysql-leap mysqldump -uleap_user -pZs19981030. leap_db > backup.sql

# Using local MySQL
mysqldump -uleap_user -p leap_db > backup.sql
```

