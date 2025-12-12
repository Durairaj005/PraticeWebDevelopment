from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from app.models import SubmissionCreate, SubmissionUpdate, SubmissionResponse, UserResponse
from app.auth import get_current_user
from app.database import get_database
from bson import ObjectId

router = APIRouter()

def require_admin(current_user: UserResponse = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("", response_model=List[SubmissionResponse])
async def get_submissions(
    assignment_id: str = None,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    query = {}
    
    if current_user.role == "student":
        query["student_id"] = current_user.id
    
    if assignment_id:
        query["assignment_id"] = assignment_id
    
    submissions = []
    async for submission in db.submissions.find(query).sort("submitted_at", -1):
        submission["id"] = str(submission["_id"])
        submissions.append(SubmissionResponse(**submission))
    
    return submissions

@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    
    try:
        submission = await db.submissions.find_one({"_id": ObjectId(submission_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid submission ID")
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Students can only view their own submissions
    if current_user.role == "student" and submission["student_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    submission["id"] = str(submission["_id"])
    return SubmissionResponse(**submission)

@router.post("", response_model=SubmissionResponse)
async def create_submission(
    submission_data: SubmissionCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit assignments")
    
    # Check if assignment exists
    try:
        assignment = await db.assignments.find_one({"_id": ObjectId(submission_data.assignment_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid assignment ID")
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if student already submitted
    existing = await db.submissions.find_one({
        "assignment_id": submission_data.assignment_id,
        "student_id": current_user.id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted this assignment")
    
    submission_doc = {
        "assignment_id": submission_data.assignment_id,
        "student_id": current_user.id,
        "student_name": current_user.name,
        "submission_text": submission_data.submission_text,
        "file_url": submission_data.file_url,
        "status": "pending",
        "marks": None,
        "feedback": None,
        "submitted_at": datetime.utcnow(),
        "graded_at": None
    }
    
    result = await db.submissions.insert_one(submission_doc)
    submission_doc["id"] = str(result.inserted_id)
    
    return SubmissionResponse(**submission_doc)

@router.put("/{submission_id}", response_model=SubmissionResponse)
async def update_submission(
    submission_id: str,
    submission_update: SubmissionUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    
    try:
        submission = await db.submissions.find_one({"_id": ObjectId(submission_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid submission ID")
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    update_data = {}
    
    # Students can update their own submissions if not graded
    if current_user.role == "student":
        if submission["student_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if submission["status"] == "graded":
            raise HTTPException(status_code=400, detail="Cannot update graded submission")
        
        if submission_update.submission_text is not None:
            update_data["submission_text"] = submission_update.submission_text
        if submission_update.file_url is not None:
            update_data["file_url"] = submission_update.file_url
    
    # Admin can grade submissions
    elif current_user.role == "admin":
        if submission_update.marks is not None:
            update_data["marks"] = submission_update.marks
        if submission_update.feedback is not None:
            update_data["feedback"] = submission_update.feedback
        if submission_update.status is not None:
            update_data["status"] = submission_update.status
            if submission_update.status == "graded":
                update_data["graded_at"] = datetime.utcnow()
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    await db.submissions.update_one({"_id": ObjectId(submission_id)}, {"$set": update_data})
    
    updated = await db.submissions.find_one({"_id": ObjectId(submission_id)})
    updated["id"] = str(updated["_id"])
    
    return SubmissionResponse(**updated)

@router.delete("/{submission_id}")
async def delete_submission(
    submission_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    
    try:
        submission = await db.submissions.find_one({"_id": ObjectId(submission_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid submission ID")
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Only admin or the student who submitted can delete
    if current_user.role == "student" and submission["student_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if submission["status"] == "graded" and current_user.role == "student":
        raise HTTPException(status_code=400, detail="Cannot delete graded submission")
    
    await db.submissions.delete_one({"_id": ObjectId(submission_id)})
    
    return {"message": "Submission deleted successfully"}
