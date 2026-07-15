from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.models import AssignmentCreate, AssignmentUpdate, AssignmentResponse, UserResponse
from app.auth import get_current_user
from app.database import get_database
from bson import ObjectId

router = APIRouter()

# Helper function to check if user is admin
def require_admin(current_user: UserResponse = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("", response_model=List[AssignmentResponse])
async def get_assignments(
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    
    assignments = []
    async for assignment in db.assignments.find().sort("due_date", -1):
        assignment["id"] = str(assignment["_id"])
        assignments.append(AssignmentResponse(**assignment))
    
    return assignments

@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    
    try:
        assignment = await db.assignments.find_one({"_id": ObjectId(assignment_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid assignment ID")
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    assignment["id"] = str(assignment["_id"])
    return AssignmentResponse(**assignment)

@router.post("", response_model=AssignmentResponse)
async def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: UserResponse = Depends(require_admin)
):
    db = get_database()
    now = datetime.utcnow()
    
    assignment_doc = {
        "title": assignment_data.title,
        "description": assignment_data.description,
        "due_date": assignment_data.due_date,
        "max_marks": assignment_data.max_marks,
        "created_by": current_user.id,
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.assignments.insert_one(assignment_doc)
    assignment_doc["id"] = str(result.inserted_id)
    
    return AssignmentResponse(**assignment_doc)

@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: str,
    assignment_update: AssignmentUpdate,
    current_user: UserResponse = Depends(require_admin)
):
    db = get_database()
    
    try:
        assignment = await db.assignments.find_one({"_id": ObjectId(assignment_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid assignment ID")
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    update_data = {"updated_at": datetime.utcnow()}
    if assignment_update.title is not None:
        update_data["title"] = assignment_update.title
    if assignment_update.description is not None:
        update_data["description"] = assignment_update.description
    if assignment_update.due_date is not None:
        update_data["due_date"] = assignment_update.due_date
    if assignment_update.max_marks is not None:
        update_data["max_marks"] = assignment_update.max_marks
    
    await db.assignments.update_one({"_id": ObjectId(assignment_id)}, {"$set": update_data})
    
    updated = await db.assignments.find_one({"_id": ObjectId(assignment_id)})
    updated["id"] = str(updated["_id"])
    
    return AssignmentResponse(**updated)

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: str,
    current_user: UserResponse = Depends(require_admin)
):
    db = get_database()
    
    try:
        assignment = await db.assignments.find_one({"_id": ObjectId(assignment_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid assignment ID")
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Delete assignment and all related submissions
    await db.assignments.delete_one({"_id": ObjectId(assignment_id)})
    await db.submissions.delete_many({"assignment_id": assignment_id})
    
    return {"message": "Assignment deleted successfully"}

@router.get("/{assignment_id}/stats")
async def get_assignment_stats(
    assignment_id: str,
    current_user: UserResponse = Depends(require_admin)
):
    db = get_database()
    
    total_students = await db.users.count_documents({"role": "student"})
    total_submissions = await db.submissions.count_documents({"assignment_id": assignment_id})
    graded = await db.submissions.count_documents({"assignment_id": assignment_id, "status": "graded"})
    pending = await db.submissions.count_documents({"assignment_id": assignment_id, "status": "pending"})
    
    return {
        "total_students": total_students,
        "total_submissions": total_submissions,
        "graded": graded,
        "pending": pending,
        "submission_rate": round((total_submissions / total_students * 100) if total_students > 0 else 0, 2)
    }
