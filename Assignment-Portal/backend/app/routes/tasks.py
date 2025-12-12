from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from app.models import TaskCreate, TaskUpdate, TaskResponse, UserResponse
from app.auth import get_current_user
from app.database import get_database
from bson import ObjectId

router = APIRouter()

@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    query = {"user_id": current_user.id}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    tasks = []
    async for task in db.tasks.find(query):
        task["id"] = str(task["_id"])
        tasks.append(TaskResponse(**task))
    
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: UserResponse = Depends(get_current_user)):
    db = get_database()
    
    try:
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this task")
    
    task["id"] = str(task["_id"])
    return TaskResponse(**task)

@router.post("", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    now = datetime.utcnow()
    
    task_doc = {
        "user_id": current_user.id,
        "title": task_data.title,
        "description": task_data.description,
        "status": task_data.status,
        "priority": task_data.priority,
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.tasks.insert_one(task_doc)
    task_doc["id"] = str(result.inserted_id)
    
    return TaskResponse(**task_doc)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    
    try:
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    update_data = {"updated_at": datetime.utcnow()}
    if task_update.title is not None:
        update_data["title"] = task_update.title
    if task_update.description is not None:
        update_data["description"] = task_update.description
    if task_update.status is not None:
        update_data["status"] = task_update.status
    if task_update.priority is not None:
        update_data["priority"] = task_update.priority
    
    await db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": update_data})
    
    updated = await db.tasks.find_one({"_id": ObjectId(task_id)})
    updated["id"] = str(updated["_id"])
    
    return TaskResponse(**updated)

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: UserResponse = Depends(get_current_user)):
    db = get_database()
    
    try:
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    
    await db.tasks.delete_one({"_id": ObjectId(task_id)})
    return {"message": "Task deleted successfully"}
