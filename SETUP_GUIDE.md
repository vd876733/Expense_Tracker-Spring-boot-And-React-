# 🚀 Setup Guide - Run Expense Tracker in VS Code

## Step 1: Create the Users Table

### Option A: Using MySQL Extension (Recommended)

1. **Install MySQL Extension**
   - Open VS Code
   - Press `Ctrl+P`
   - Type: `ext install cweijan.vscode-mysql-client2`
   - Click Install

2. **Connect to MySQL Database**
   - Click the **MySQL** icon in the left sidebar
   - Click the **"+"** button to add a new connection
   - Fill in the connection details:
     - **Host:** `localhost`
     - **Port:** `3306`
     - **Username:** `root`
     - **Password:** `varad`
   - Press Enter to connect

3. **Create the Users Table**
   - Expand the MySQL connection in the sidebar
   - Right-click on **finance_db** database
   - Select **"New Query"**
   - Open `setup_users_table.sql` from the project root
   - Copy all the SQL code
   - Paste it into the query editor
   - Press `Ctrl+Shift+Enter` or click **Run** button
   - Check the output for success: `Table created successfully`

4. **Verify Table Creation**
   - In the MySQL sidebar, expand **finance_db** → **Tables**
   - You should see `users` table listed
   - Right-click `users` → View Data to confirm it's empty (or has admin user if inserted)

### Option B: Using PowerShell Terminal

```powershell
# Connect to MySQL and execute the SQL file
mysql -u root -p -D finance_db < setup_users_table.sql

# When prompted, enter password: varad

# Verify table creation
mysql -u root -p -D finance_db -e "DESC users; SELECT * FROM users;"
```

---

## Step 2: Open Split Terminals in VS Code

1. Open Terminal: `Ctrl + `` ` (backtick)
2. Click the **Split Terminal** button (⊞ icon in top-right of terminal panel)
3. You now have two side-by-side terminals

---

## Step 3: Start Backend (Left Terminal)

```powershell
# Navigate to project root
cd D:\Expense_Tracker-Spring-boot-And-React-

# Set JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

# Clean build and start Spring Boot
mvn clean spring-boot:run
```

**Expected Output:**
```
Tomcat started on port(s): 8080 (http)
Started FinanceTrackerApplication in X.XXX seconds
```

---

## Step 4: Start Frontend (Right Terminal)

```powershell
# Navigate to frontend directory
cd D:\Expense_Tracker-Spring-boot-And-React-\frontend

# Start React development server
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view personal-finance-tracker-frontend in the browser.
Local: http://localhost:3001
```

---

## Step 5: Test the Application

1. **Open Browser** → Navigate to `http://localhost:3001`

2. **Test Registration:**
   - Click "Sign up here"
   - Fill in form:
     - Username: `testuser`
     - Email: `test@example.com`
     - Password: `password123`
   - Click "Sign up"
   - Should see success message and redirect to dashboard

3. **Test Login:**
   - Log out (or open new browser tab)
   - Navigate to `http://localhost:3001`
   - Login with:
     - Username: `admin`
     - Password: `admin123`
   - Should see dashboard with charts and transaction list

4. **Verify Database:**
   - In MySQL Extension, right-click `users` table → View Data
   - Should see your registered users

---

## 🎯 Troubleshooting

### Backend won't start
```
Error: JAVA_HOME not set correctly
Solution: Run this first:
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
```

### Frontend on wrong port
```
Error: React running on port 3000 or 3002 instead of 3001
Solution: Kill the process and restart:
npm start  # Will automatically use 3001
```

### Users table not created
```
Error: "Table 'users' doesn't exist"
Solution: 
1. Verify finance_db exists in MySQL Extension sidebar
2. Run setup_users_table.sql again
3. Check for SQL errors in the MySQL output panel
```

### CORS errors in browser console
```
Error: "Access to XMLHttpRequest blocked by CORS policy"
Solution:
1. Verify backend is running on port 8080
2. Check CorsConfig.java includes localhost:3001
3. Restart Spring Boot with: Ctrl+C then mvn clean spring-boot:run
```

### Registration fails
```
Error: "Registration failed. Please try again."
Solution:
1. Check Spring Boot console for error messages
2. Verify users table exists with: SELECT * FROM users;
3. Check network tab in browser DevTools for exact error response
4. Ensure password is at least 6 characters
```

---

## 📊 Your VS Code Layout

```
┌──────────────────────────────────────────────────────────────┐
│  File Tree        │        Editor                            │
│  ├─ src/          │  application.properties (open)           │
│  ├─ frontend/     │                                          │
│  └─ setup_users...│                                          │
├──────────────────────────────────────────────────────────────┤
│ Backend (8080)           │  Frontend (3001)                   │
│ > mvn spring-boot:run    │  > npm start                       │
│ [Spring Boot logs...]    │  [React logs...]                   │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Success Checklist

- [ ] Users table created in finance_db
- [ ] Spring Boot running on port 8080
- [ ] React running on port 3001
- [ ] Can register new user
- [ ] Can login with admin/admin123
- [ ] Dashboard loads with charts
- [ ] MySQL Extension shows users in table

Once all items are checked, your full-stack expense tracker is ready! 🎉

---

## 📝 Files Reference

- **Backend Entry:** `src/main/java/com/financetracker/FinanceTrackerApplication.java`
- **Auth Controller:** `src/main/java/com/financetracker/controller/AuthController.java`
- **User Entity:** `src/main/java/com/financetracker/entity/User.java`
- **Frontend Entry:** `frontend/src/index.js`
- **Login Component:** `frontend/src/components/Login.jsx`
- **Register Component:** `frontend/src/components/Register.jsx`
- **SQL Setup:** `setup_users_table.sql`
