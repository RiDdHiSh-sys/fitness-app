from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from models.pose import PoseFeedbackRequest, PoseFeedbackResponse, PoseFrameData, PoseSessionDB
from routes.user import verify_user_exists, get_current_user_id
from routes.workout import get_today_start

router = APIRouter()

@router.post("/pose-feedback", response_model=PoseFeedbackResponse, status_code=status.HTTP_200_OK)
async def get_pose_feedback(
    pose_req: PoseFeedbackRequest,
    db = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Evaluates real-time camera exercise angles, returns corrective feedback,
    and logs the frame to the user's pose session.
    """
    # Enforce authentication user match
    if pose_req.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot log pose feedback for another user"
        )
        
    # 1. Verify user exists
    await verify_user_exists(pose_req.user_id, db)
    
    # 2. Form analysis logic
    is_correct = True
    feedback = "Good form!"
    correction = ""
    
    if pose_req.exercise == "squat":
        # Check back angle first (should not lean forward too much)
        if pose_req.back_angle < 60.0:
            is_correct = False
            feedback = "Chest falling forward"
            correction = "Keep your chest up and engage your core to maintain a neutral spine."
        # Check knee depth
        elif pose_req.knee_angle > 115.0:
            is_correct = False
            feedback = "Shallow squat depth"
            correction = "Lower your hips further until your thighs are parallel to the floor (aim for 90-100 degrees)."
        elif pose_req.knee_angle < 65.0:
            is_correct = False
            feedback = "Squatting too deep"
            correction = "Avoid going too deep if you feel your lower back rounding or heels rising."
        else:
            feedback = "Excellent squat depth and back alignment!"
            correction = "Maintain this controlled tempo throughout the set."
            
    elif pose_req.exercise == "bicep_curl":
        # Check back swing (should remain upright, close to 90 degrees)
        if pose_req.back_angle < 75.0 or pose_req.back_angle > 105.0:
            is_correct = False
            feedback = "Torso swinging detected"
            correction = "Keep your upper body completely still. Don't use momentum or lower back sway to swing the weight."
        # Check elbow range of motion
        elif pose_req.elbow_angle > 165.0:
            feedback = "Full extension reached"
            correction = "Squeeze and begin the lift without swinging your elbow forward."
        elif pose_req.elbow_angle < 45.0:
            feedback = "Full contraction reached"
            correction = "Squeeze your bicep at the top of the range before slowly lowering."
        else:
            feedback = "Good elbow tracking"
            correction = "Keep the movement slow, focusing on a 3-second negative (lowering) phase."
            
    # 3. Log to pose_sessions collection
    today_start = get_today_start()
    
    # Find existing session for user, exercise, and normalized date
    session = await db.pose_sessions.find_one({
        "user_id": pose_req.user_id,
        "exercise": pose_req.exercise.value,
        "date": today_start
    })
    
    try:
        if not session:
            # Create a new session starting with frame 1
            frame_data = PoseFrameData(
                frame=1,
                knee_angle=pose_req.knee_angle,
                elbow_angle=pose_req.elbow_angle,
                back_angle=pose_req.back_angle,
                feedback=feedback
            )
            
            new_session = {
                "user_id": pose_req.user_id,
                "exercise": pose_req.exercise.value,
                "date": today_start,
                "angle_data": [frame_data.model_dump()]
            }
            await db.pose_sessions.insert_one(new_session)
        else:
            # Determine next frame number
            existing_frames = session.get("angle_data", [])
            next_frame_num = len(existing_frames) + 1
            
            new_frame = PoseFrameData(
                frame=next_frame_num,
                knee_angle=pose_req.knee_angle,
                elbow_angle=pose_req.elbow_angle,
                back_angle=pose_req.back_angle,
                feedback=feedback
            )
            
            await db.pose_sessions.update_one(
                {"_id": session["_id"]},
                {"$push": {"angle_data": new_frame.model_dump()}}
            )
            
        return PoseFeedbackResponse(
            feedback=feedback,
            is_correct=is_correct,
            correction=correction
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to log pose session frame: {str(e)}"
        )
