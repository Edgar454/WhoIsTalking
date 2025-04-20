import asyncio
import os
from celery import Celery
from celery.signals import task_failure , task_success
from whoisspeaking.utils import diaratize_and_transcript_audio  
import logging
import requests

celery_app = Celery(
    "tasks",
    broker= "redis://localhost:6379/0",
    backend= "redis://localhost:6379/0",
)


# FastAPI Backend URL from environment variable
FASTAPI_BACKEND_URL = os.getenv("FASTAPI_BACKEND_URL", "http://localhost:8000/update-task-result")

# logging config
logging.basicConfig(
    level=logging.INFO,  
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@celery_app.task(autoretry_for = (Exception,)  , max_retries = 5)
def process_audio(filehash , audio_content , audio_filename):
    """
    Background task for processing the audio asynchronously using asyncio.
    """
    
    try:
        logging.info("Processing started")
        diarization , transcription , speaker_transcript = asyncio.run(diaratize_and_transcript_audio(audio_content , audio_filename))
        logging.info("Processing completed")

        return {"filehash":filehash ,"speaker_transcript":speaker_transcript ,  "diarization":diarization}
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"error": str(e)}
    

def notify_backend(url, payload):
    """
    Notify the FastAPI backend with retries, including service authentication.
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=payload, timeout=5)
            response.raise_for_status()
            print(f"Notification sent successfully: {response.status_code}")
            return
        
        except requests.RequestException as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                print("Max retries reached. Notification failed.")


@task_success.connect
def on_task_success(sender=None, result=None, **kwargs):
    """
    Send the task result to the FastAPI backend upon successful completion.
    """
    task_id = sender.request.id
    url = f"{FASTAPI_BACKEND_URL}/{task_id}"
    payload = {"result": result}
    notify_backend(url, payload)


@task_failure.connect
def on_task_failure(sender=None, exception=None, **kwargs):
    """
    Notify the FastAPI backend of task failure.
    """
    task_id = sender.request.id
    url = f"{FASTAPI_BACKEND_URL}/{task_id}"
    payload = {"result": str(exception)}
    notify_backend(url, payload)

