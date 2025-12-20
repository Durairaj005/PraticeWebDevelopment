# 🎓 EduAnalytics - Quick Reference Guide

## 🚀 Quick Start

### Start Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend
```bash
cd frontend
npm run dev
```

**Access**: http://localhost:5173

---

## 👤 Default Login Credentials

### Admin
- Email: `admin@eduanalytics.com`
- Password: `admin123`

### Test Student (Batch 2023 - Full Features)
- Register: `CS2023001`
- Name: Rohan Kumar
- DOB: `2006-08-12`

### Test Student (Batch 2025 - CA Only)
- Register: `CS2025001`
- Name: Aarav Patel
- DOB: `2008-05-15`

---

## 📊 What Works

✅ **Student Features**
- Dashboard with CA/Semester metrics
- Leaderboard (dual ranking system)
- Analytics and visualizations
- PDF report export

✅ **Admin Features**
- Mark editing and CSV upload
- Batch comparisons
- Student performance analysis
- Auto semester publishing

✅ **Data**
- 10 students across 2 batches
- Semester marks for Batch 2023
- CA marks for all batches
- All calculations working correctly

---

## 🎯 Key Thresholds

| Category | Threshold | Display |
|----------|-----------|---------|
| **CA Excellence** | ≥ 55 | ⭐ Stars |
| **Semester Excellence** | > 80 | ⭐ Blue Stars |
| **Semester Distinction** | > 90 | 🏆 Achievement |
| **Pass Rate** | ≥ 50 | ✓ Passed |

---

## 📁 Keep These Files

```
PROJECT_FINAL_STATUS_REPORT.md  ← Complete documentation
QUICK_REFERENCE.md              ← This file
README.md                       ← Original README
EduAnalytics/                   ← Main application
eduanalytics.db                 ← Database
```

---

## ⚠️ Important Notes

1. **Database**: SQLite file `eduanalytics.db` - Don't delete!
2. **Backend Port**: 8000 (make sure it's free)
3. **Frontend Port**: 5173 (Vite default)
4. **Semester Data**: Only Batch 2023 has semester marks
5. **Batch 2025**: CA-only, no semester analytics

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Check Python is installed, port 8000 is free |
| Frontend won't load | Run `npm install` in frontend folder |
| Charts not showing | Make sure you're logged in as Batch 2023 student |
| Marks not updating | Logout and login again to refresh token |
| Database error | Delete `eduanalytics.db` and restart (recreates DB) |

---

## 📞 System Status

- **Backend**: ✅ FastAPI + SQLAlchemy
- **Frontend**: ✅ React + Vite
- **Database**: ✅ SQLite
- **Authentication**: ✅ JWT Tokens
- **Charts**: ✅ Chart.js
- **Styling**: ✅ Tailwind CSS

**All systems operational and ready to use!**

---

*System ready for production | Last verified: Dec 20, 2025*
