from fastapi import APIRouter, HTTPException ,UploadFile , File
import logging 
import base64
import io
import json


from celery.result import AsyncResult
from whoisspeaking.celery_worker import process_audio , celery_app
from whoisspeaking.utils import get_file_hash , get_redis_connection


logging.basicConfig(
    level=logging.INFO,  
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/process-audio/")
async def process_material(audio: UploadFile = File(...)):
    
    try:
        audio_content = await audio.read()  
        filehash = get_file_hash(audio_content)

        task = process_audio.delay(filehash , audio_content , audio.filename)
        return {"message": "Processing started", "task_id": task.id , "file_id":filehash}
        
    except Exception as e:
        logging.error(f"Error in processing: {e}")
        raise HTTPException(status_code=500, detail='Something went wrong')
    
    
@router.get("/task-status/{task_id}")
def get_task_status(task_id: str):
    # Get the task status from Celery
    task = AsyncResult(task_id , app = celery_app)

    if task.state == "PENDING":
        return {"status": "Pending"}
    
    elif task.state == "SUCCESS":
        return {"status": "Success"}
    
    elif task.state == "FAILURE":
        return {"status": "Failure", "error": str(task.result)}
    else:
        return {"status": task.state}
    

@router.post("/update-task-result/{task_id}")
async def update_task_result(task_id: str,
                            payload: dict,):
    """
    Update the task result in the cache.
    """

    result = payload.get("result")
    error = payload.get("error")
    

    if result:
        transcription = result.get("speaker_transcript")
        diarization = result.get("diarization")

        redis = await get_redis_connection()
        await redis.set(f"task_result:{result.get('filehash')}" , json.dumps({"transcription":transcription , "diarization":diarization}) )
        await redis.publish(f"task_result:{result.get('filehash')}" , json.dumps({"transcription":transcription , "diarization":diarization}) )

        
        return {"message": "Task result updated successfully!"}
    
    elif error :
        logger.error(f"Task failed: {error}")
        raise HTTPException(status_code=500, detail=f"Task failed: {error}")


@router.get("/get-task-result/")
async def get_task_result(filehash: str):
    redis = await get_redis_connection()

    # Essayer de récupérer le résultat de la tâche depuis Redis
    result = await redis.get(f"task_result:{filehash}")

    if result:
        return json.loads(result)  # Retourner les résultats en format JSON
    else:
        raise HTTPException(status_code=404, detail="Task result not found")