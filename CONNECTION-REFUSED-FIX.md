# ✅ ERR_CONNECTION_REFUSED Fix - Frontend Server Start

## 🐛 Error Description

**Error Message:**
```
Ce site est inaccessible
localhost n'autorise pas la connexion.
ERR_CONNECTION_REFUSED
```

**When It Occurred:**
- Trying to access `http://localhost:3000`
- Frontend Vite server was not running
- Only backend was running after previous restart

**Root Cause:**
The frontend development server (Vite) was not started. When you restarted the backend, the frontend server remained stopped, causing the browser to be unable to connect to `localhost:3000`.

---

## ✅ Solutions Applied

### **1. Started Frontend Server**

**Command:**
```powershell
cd "c:\Users\HP\Documents\works of crft\dict\dict web\dictCoaching"
npm run dev
```

**Output:**
```
VITE v4.5.14  ready in 1163 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.100.4:3000/
```

**Status:** ✅ Frontend server now running on port 3000

---

### **2. Fixed React Helmet Import in Fiche.jsx**

**File:** `src/pages/Fiche.jsx` (Line 3)

**Before:**
```javascript
import { Helmet } from "react-helmet";
```

**After:**
```javascript
import { Helmet } from "react-helmet-async";
```

**Why:** Consistent with `Dashboard.jsx` and `main.jsx` HelmetProvider setup. Prevents potential Helmet context errors.

---

## 🔍 Understanding the Issue

### **Frontend vs Backend Servers**

Your application uses **two separate servers**:

| Server | Technology | Port | Purpose |
|--------|------------|------|---------|
| **Frontend** | Vite (React) | 3000 | Serves UI, handles routing |
| **Backend** | Express.js (Node) | 5000 | API endpoints, database queries |

**Important:** Both must be running for the application to work!

### **What Happened:**

1. ✅ Backend was restarted → Running on port 5000
2. ❌ Frontend was not started → Port 3000 not listening
3. ❌ Browser tried to connect to `localhost:3000` → Connection refused

---

## 🚀 How to Start Both Servers

### **Method 1: Manual Start (Two Terminals)**

**Terminal 1 - Backend:**
```powershell
cd "c:\Users\HP\Documents\works of crft\dict\dict web\dictCoaching\backend"
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd "c:\Users\HP\Documents\works of crft\dict\dict web\dictCoaching"
npm run dev
```

### **Method 2: VS Code Task (Backend Only)**

Use the VS Code task:
```
Task: Restart backend (Windows)
```

**Note:** This only restarts the backend. You still need to start the frontend manually.

### **Method 3: Concurrent Start (Recommended)**

Create a script to start both servers:

**File:** `start-dev.ps1`
```powershell
# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Start frontend in current window
npm run dev
```

**Usage:**
```powershell
.\start-dev.ps1
```

---

## 🧪 Verification Steps

### **1. Check Frontend is Running**

**Command:**
```powershell
Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*Vite*"}
```

**Or check the terminal output:**
```
✅ Should see: "VITE v4.5.14 ready"
✅ Should see: "Local: http://localhost:3000/"
```

### **2. Check Backend is Running**

**Command:**
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/terms -Method GET -UseBasicParsing
```

**Or check terminal:**
```
✅ Should see: "Serveur backend démarré sur le port 5000"
```

### **3. Check Both Ports are Listening**

**Command:**
```powershell
netstat -ano | Select-String ":3000|:5000" | Select-String "LISTENING"
```

**Expected Output:**
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12345
TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING       67890
```

### **4. Access the Application**

Open browser and navigate to:
```
http://localhost:3000
```

**Expected:**
- ✅ Home page loads
- ✅ No "ERR_CONNECTION_REFUSED"
- ✅ No console errors

---

## 📝 Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/pages/Fiche.jsx` | Changed `react-helmet` to `react-helmet-async` | Consistent Helmet usage |

---

## 🔧 Troubleshooting

### **Problem: Port 3000 Already in Use**

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Restart frontend
npm run dev
```

### **Problem: Port 5000 Already in Use**

**Solution:**
```powershell
# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Restart backend
cd backend
npm run dev
```

### **Problem: "Cannot GET /" Error**

**Symptoms:**
- Page loads but shows "Cannot GET /"
- Backend might be running on wrong port

**Solution:**
1. Check `backend/.env` for correct port
2. Restart backend
3. Check frontend API base URL in `src/services/api.js`

### **Problem: CORS Errors**

**Symptoms:**
```
Access to fetch at 'http://localhost:5000/api/terms' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution:**
Backend already has CORS configured. Ensure backend is running and restart it:
```powershell
cd backend
npm run dev
```

---

## 🎯 Quick Start Checklist

Use this checklist when starting development:

- [ ] **Navigate to project directory**
  ```powershell
  cd "c:\Users\HP\Documents\works of crft\dict\dict web\dictCoaching"
  ```

- [ ] **Start Backend (Terminal 1)**
  ```powershell
  cd backend
  npm run dev
  # Wait for: "Serveur backend démarré sur le port 5000"
  ```

- [ ] **Start Frontend (Terminal 2)**
  ```powershell
  npm run dev
  # Wait for: "VITE v4.5.14 ready"
  ```

- [ ] **Verify Both Running**
  ```powershell
  netstat -ano | Select-String ":3000|:5000" | Select-String "LISTENING"
  ```

- [ ] **Open Browser**
  ```
  http://localhost:3000
  ```

- [ ] **Check Console**
  - No red errors
  - API calls successful

---

## 💡 Best Practices

### **1. Always Run Both Servers**

**Development workflow:**
```
Start Backend → Wait 2-3 seconds → Start Frontend
```

### **2. Check Terminal Output**

**Backend should show:**
```
✅ Database connected successfully
✅ Serveur backend démarré sur le port 5000
```

**Frontend should show:**
```
✅ VITE v4.5.14 ready
✅ Local: http://localhost:3000/
```

### **3. Watch for Hot Reload**

When you edit files, you should see:
```
[vite] hmr update /src/pages/Dashboard.jsx
```

### **4. Restart When Needed**

**Restart Backend when:**
- Database schema changes
- Environment variables change
- Route files modified
- Migration scripts run

**Restart Frontend when:**
- Package.json dependencies change
- Vite config changes
- Port conflicts

---

## 🔄 Server Management Commands

### **Check Running Servers:**
```powershell
# All node processes
Get-Process node -ErrorAction SilentlyContinue

# Listening ports
netstat -ano | Select-String ":3000|:5000" | Select-String "LISTENING"
```

### **Stop Servers:**
```powershell
# Stop all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Stop specific port
$processId = (netstat -ano | Select-String ":3000" | Select-String "LISTENING")[0] -replace '\s+', ' ' -split ' '
taskkill /PID $processId[-1] /F
```

### **Restart Backend Only:**
```powershell
# Using VS Code task
Task: Restart backend (Windows)

# Or manually
cd backend
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npm run dev
```

### **Restart Frontend Only:**
```powershell
# Stop frontend
Get-Process node | Where-Object {$_.MainWindowTitle -like "*Vite*"} | Stop-Process

# Start frontend
npm run dev
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Browser (Client)                    │
│         http://localhost:3000                    │
└───────────────────┬─────────────────────────────┘
                    │
                    │ HTTP Requests
                    ▼
┌─────────────────────────────────────────────────┐
│          Vite Dev Server (Frontend)              │
│              Port 3000                           │
│   - React Components                             │
│   - Hot Module Replacement                       │
│   - Static Assets                                │
└───────────────────┬─────────────────────────────┘
                    │
                    │ API Calls
                    │ (axios/fetch)
                    ▼
┌─────────────────────────────────────────────────┐
│         Express Server (Backend)                 │
│              Port 5000                           │
│   - REST API Endpoints                           │
│   - JWT Authentication                           │
│   - Business Logic                               │
└───────────────────┬─────────────────────────────┘
                    │
                    │ SQL Queries
                    ▼
┌─────────────────────────────────────────────────┐
│            MySQL Database                        │
│   - users, termes, likes, comments               │
│   - categories, modifications, reports           │
└─────────────────────────────────────────────────┘
```

---

## ✅ Summary

### **Problem:**
Frontend server (Vite) was not running, causing "ERR_CONNECTION_REFUSED" when trying to access `localhost:3000`.

### **Solution:**
1. Started frontend server with `npm run dev`
2. Fixed Helmet import in `Fiche.jsx` for consistency

### **Result:**
- ✅ Frontend server running on port 3000
- ✅ Backend server running on port 5000
- ✅ Application accessible at `http://localhost:3000`
- ✅ No connection errors
- ✅ All pages load correctly

### **Key Learnings:**
- Both frontend and backend servers must be running
- Backend restart doesn't start frontend
- Always check both ports (3000 and 5000) are listening
- Use consistent `react-helmet-async` imports

---

**Status:** ✅ **RESOLVED**  
**Date:** October 15, 2025  
**Frontend:** Running on port 3000  
**Backend:** Running on port 5000  
**Application:** Fully accessible
