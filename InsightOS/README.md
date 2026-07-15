# InsightOS Enterprise

**InsightOS** is a next-generation, AI-powered student complaint and feedback management system designed specifically for university departments. Built with modern web technologies, InsightOS bridges the gap between students and administration, allowing for rapid issue resolution, automated sentiment analysis, and real-time operational insights.

![InsightOS Concept](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000)

## 🚀 Features

- **Multi-Tenant Roles (RBAC):** Distinct dashboards and access levels for Students, Heads of Department (HODs), and Super Admins.
- **AI-Powered Analysis:** Automatically tags complaints with priority, sentiment, and emotional context using LLMs (Groq Llama 3 / Google Gemini) so HODs know what to tackle first.
- **Real-Time Notifications:** Students receive immediate alerts when the status of their complaints is updated.
- **Visual Evidence:** Secure, cloud-based file uploads (via Cloudinary) allow students to attach photos to their complaints.
- **Super Admin Analytics:** An interactive dashboard (built with Recharts) aggregates all department data to reveal trends, status distributions, and category hotspots.
- **Modern Aesthetic:** A premium, dark-mode glassmorphism design that feels responsive and alive.

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts.
- **Backend:** Python, FastAPI, SQLAlchemy (SQLite/PostgreSQL).
- **AI/ML:** LangChain, Google GenAI, Groq.
- **File Storage:** Cloudinary.

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/insightos.git
cd insightos
```

### 2. Backend Setup
Navigate into the backend directory:
```bash
cd backend
```
Create a virtual environment and install dependencies:
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file using the example:
```bash
cp .env.example .env
```
*(Make sure to populate your `.env` file with real API keys if you wish to use the AI and Cloudinary features.)*

Run the FastAPI server:
```bash
uvicorn app.main:app --reload
```

### 3. Frontend Setup
Open a new terminal window and navigate to the frontend directory:
```bash
cd frontend
```
Install dependencies and run the Vite dev server:
```bash
npm install
npm run dev
```

### 4. First Run & Seeding
To access the Super Admin dashboard, you need to create the first admin account. InsightOS includes a convenient setup endpoint for development.
While the backend server is running, navigate to:
`http://localhost:8000/setup-admin`
This will automatically generate a user with the email `admin@insightos.edu` and the password `admin`.

## 🌐 Deployment Instructions

### Backend (Render / Railway / AWS)
1. Ensure your host supports Python 3.10+.
2. Set the `DATABASE_URL` environment variable to a persistent database (like PostgreSQL).
3. Set the `SECRET_KEY` to a securely generated random string.
4. The start command should be: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel / Netlify)
1. Point your deployment platform to the `frontend` directory.
2. Build command: `npm run build`
3. Output directory: `dist`
4. **Important**: Add an environment variable (e.g., `VITE_API_URL`) to point to your live backend domain, and update `src/services/api.ts` to use it instead of `localhost:8000`.

## 🔒 Security Notes
- The default SQLite database is suitable for development. Production deployments MUST use PostgreSQL or similar to handle concurrent writes and data persistence.
- Ensure CORS in `backend/app/main.py` is locked down to your specific frontend production URL before launching publicly.
