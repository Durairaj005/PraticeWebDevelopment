# Assignment Submission Portal - Quick Start Guide

## 🚀 EASIEST WAY TO RUN (Recommended)

**Just double-click:** `START.bat`

This will automatically:
- ✅ Start the backend server
- ✅ Start the frontend server  
- ✅ Open your browser to http://localhost:3001

---

## 🚀 Alternative Methods

### Method 1: Using Individual Batch Files

1. **Start Backend**: Double-click `start-backend.bat`
2. **Start Frontend**: Double-click `start-frontend.bat`
3. **Open Browser**: Go to http://localhost:3001

### Method 2: Using PowerShell (Manual)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\LENOVO\Desktop\task1\backend
python main.py
```

**Terminal 2 - Frontend:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
$env:Path += ";E:\nodejs"
cd C:\Users\LENOVO\Desktop\task1\frontend
npm run dev
```

---

## ✅ What's Already Running

**Backend**: ✅ http://localhost:8000 (MongoDB connected!)  
**Frontend**: ✅ http://localhost:3001 (Ready to use!)

Just open your browser and start using the portal!

---

## 🔧 Troubleshooting

### If MongoDB Connection Fails:

**The app now includes automatic retry (3 attempts) with helpful error messages!**

1. **Check Internet Connection**
   - Try using mobile hotspot
   - Disable VPN if active

2. **Firewall/Antivirus**
   - Temporarily disable to test
   - Add Python to firewall exceptions

3. **MongoDB Atlas Settings**
   - Go to https://cloud.mongodb.com
   - Database Access → Ensure user "taskuser" exists
   - Network Access → Add your IP (0.0.0.0/0 for testing)

### If npm Not Found:

The batch files now handle this automatically! But if you need manual setup:

```powershell
# Temporary (this session only)
$env:Path += ";E:\nodejs"

# Permanent
# 1. Win + X → System
# 2. Advanced settings → Environment Variables
# 3. Edit Path → Add: E:\nodejs
```

---

## 📊 What's Included

### Backend (FastAPI)
- ✅ User authentication with JWT
- ✅ Role-based access (Admin/Student)
- ✅ Assignment management API
- ✅ Submission & grading system
- ✅ MongoDB Atlas integration with retry logic
- ✅ Automatic connection handling

### Frontend (React + Vite)
- ✅ Admin Dashboard with charts (Pie, Bar)
- ✅ Student Dashboard with performance tracking (Line chart)
- ✅ Assignment creation & submission
- ✅ Grade viewing & feedback
- ✅ Recharts for visualizations
- ✅ Role-based navigation

---

## 🎓 How to Use

### 1. Create Admin Account (Teacher)
- Go to http://localhost:3001/signup
- Enter your details
- Select **"Teacher/Admin"** role
- Sign up → Login

### 2. Create Your First Assignment (Admin)
- Click "Create Assignment" in navbar
- Fill in:
  - Title: "Introduction to Programming"
  - Description: Assignment details
  - Due Date: Select date and time
  - Max Marks: 100
- Submit

### 3. Create Student Account
- Open **incognito/private browser** (or different browser)
- Go to http://localhost:3001/signup
- Select **"Student"** role
- Sign up → Login

### 4. Submit Assignment (Student)
- Go to "Assignments" page
- Click "Submit" on any assignment
- Write your answer
- Add file URL (Google Drive link) - optional
- Submit

### 5. Grade Submission (Admin)
- Go to Dashboard
- See "Recent Submissions" table
- Click "Grade"
- Add marks (0-100) and feedback
- Submit grade

### 6. View Results (Student)
- Check Dashboard for:
  - Recent Grades
  - Performance Trend Chart
  - Average Grade
  - Upcoming Assignments

---

## 🌐 Important URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Interactive Docs**: http://localhost:8000/docs
- **MongoDB Atlas Dashboard**: https://cloud.mongodb.com

---

## 🛑 To Stop Servers

- Close the Backend and Frontend terminal windows
- Or press `Ctrl + C` in each terminal

---

## 📁 Project Structure

```
task1/
├── START.bat                  ← Double-click this!
├── start-backend.bat          ← Or start individually
├── start-frontend.bat         ← Or start individually
├── README.md                  ← You are here
├── backend/
│   ├── main.py               ← FastAPI app
│   ├── app/
│   │   ├── auth.py           ← JWT authentication
│   │   ├── database.py       ← MongoDB connection (with retry!)
│   │   ├── models.py         ← Data models
│   │   ├── routes/
│   │   │   ├── auth.py       ← Login/Signup
│   │   │   ├── assignments.py ← Assignment CRUD
│   │   │   └── submissions.py ← Submission & grading
│   └── .env                  ← MongoDB credentials
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── AdminDashboard.jsx    ← Admin view
    │   │   ├── StudentDashboard.jsx  ← Student view
    │   │   ├── Assignments.jsx       ← Assignment list
    │   │   ├── CreateAssignment.jsx  ← Create form
    │   │   └── SubmitAssignment.jsx  ← Submit form
    │   └── components/
    │       └── Navbar.jsx            ← Navigation
    └── package.json
```

---

## 🎉 Features

### Admin Features:
- 📊 Visual analytics (Pie, Bar charts)
- ✏️ Create/Edit/Delete assignments
- 📝 Grade student submissions
- 💬 Provide feedback
- 📈 Track submission statistics
- 👥 Monitor all students

### Student Features:
- 📚 View all assignments
- ✍️ Submit assignments
- 📊 Performance trend chart
- ⭐ View grades & feedback
- ⏰ See upcoming deadlines
- 📈 Track average grade

---

**Built with:** React, FastAPI, MongoDB Atlas, TailwindCSS, Recharts
