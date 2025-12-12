from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, tasks, assignments, submissions
from app.database import connect_to_mongo, close_mongo_connection
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Task Management API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["submissions"])

@app.get("/")
def read_root():
    return {"message": "Assignment Submission Portal API with MongoDB Atlas"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "mongodb-atlas"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

print("✅ MongoDB Atlas connected!")
print("INFO:     Uvicorn running on http://0.0.0.0:8000")
print("INFO:     Application startup complete.")
