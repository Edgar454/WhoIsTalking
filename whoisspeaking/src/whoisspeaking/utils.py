"""
Utility functions for audio processing.

This module contains asynchronous functions to perform:
- Speaker diarization using a Baseten-deployed API (based on PyAnnote).
- Transcription using Groq's Whisper API.

Functions:
- request_diary(audio_path): Sends a base64-encoded audio file to the Baseten diarization model.
- request_transcription(audio_path): Sends audio to Groq's Whisper for transcription with timestamps.
- diaratize_and_transcript_audio(audio_path): Runs both diarization and transcription in parallel.

Note:
Make sure the `GROQ_API_KEY` and `BASETEN_API_KEY` environment variables are set before use.
"""

import os
import io
import json
import aiohttp
import asyncio
import base64
from redis.asyncio import Redis
from groq import Groq
from dotenv import load_dotenv
import logging
import hashlib



load_dotenv()

# logging config
logging.basicConfig(
    level=logging.INFO,  
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# API Keys
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
BASETEN_API_KEY = os.getenv('BASETEN_API_KEY')

#Redis Cache Config
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = 6379
REDIS_DB = 0

async def get_redis_connection():
    return Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        decode_responses=True  
    )

def get_file_hash(file_bytes):
    "Helper function to get the ash of files"
    return hashlib.sha256(file_bytes).hexdigest()

async def request_diary(audio):
    """
    Util function to request speaker diarization from a Baseten API 
    previously deployed using PyAnnote.

    Args:
        audio_path (str): Path to the input audio file.

    Returns:
        dict: Speaker segmentation information in JSON format.
    """
    try:
        logger.info("Request diaritization to Baseten diarization model")
        audio_base64 = base64.b64encode(audio).decode("utf-8")
        
        # Prepare JSON payload
        payload = {
            "audio_base64": audio_base64
        }

        # Send the request
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://model-5wod91nq.api.baseten.co/development/predict",
                headers={"Authorization": f"Api-Key {BASETEN_API_KEY}"},
                json=payload,
            ) as response:
                resp_json = await response.json()
                logger.info("Diarization request successful")

        return resp_json
    
    except Exception as e:
        logger.error(f"Failed to get diarization: {e}")
        return {}
   


async def request_transcription(audio_content , audio_filename):
    """
    Util function to send audio to Groq's Whisper API for transcription.

    Args:
        audio_path (str): Path to the input audio file.

    Returns:
        dict: Transcription output including timestamped segments.
    """
    audio_file = io.BytesIO(audio_content)
    audio_file.name = audio_filename

    # Initialize the Groq client
    client = Groq(api_key = GROQ_API_KEY)
    
    try :
        logger.info("Requesting transcription from Groq Whisper API")
        # Open the audio file
    
        transcription = client.audio.transcriptions.create(
            file=audio_file, 
            model="whisper-large-v3-turbo", 
            response_format="verbose_json",  
            timestamp_granularities = ["segment"], 
            )
        logger.info("Transcription request successful")
        return transcription

    except Exception as e:
        logger.error(f"Failed to get transcription: {e}")
        return {}
    
def match_transcription_and_diarization(transcription, diarization):
    # Initialize a dictionary to hold the speaker's transcript
    speaker_transcript = {speaker: [] for speaker in diarization}

    # Iterate over each diarization segment first
    for speaker, segments in diarization.items():
        for seg_start, seg_end in segments:
            collected_texts = []

            # For each transcription chunk, check if it overlaps with this diarization segment
            for chunk in transcription.segments:
                chunk_start = chunk["start"]
                chunk_end = chunk["end"]
                text = chunk["text"]

                # Overlap condition
                if not (chunk_end < seg_start or chunk_start > seg_end):
                    collected_texts.append(text)

            # Join the collected texts for that speaker segment
            if collected_texts:
                speaker_transcript[speaker].append("\n".join(collected_texts))

    return speaker_transcript

    

async def diaratize_and_transcript_audio(audio_content, audio_filename):
    """
    Runs both diarization and transcription asynchronously.

    Args:
        audio_path (str): Path to the input audio file.

    Returns:
        tuple: (diarization, transcription) results.
    """
    diarization, transcription = await asyncio.gather(request_diary(audio_content), request_transcription(audio_content ,audio_filename))
    speaker_transcript = match_transcription_and_diarization(transcription , diarization)

    return diarization , transcription , speaker_transcript


# Async internal logic
async def _process_audio(filehash, audio_content, audio_filename):
    redis = await get_redis_connection()
    result = await redis.get(f"task_result:{filehash}")
    if result:
        logger.info("Cached result found, returning.")
        result_json = json.loads(result)
        diarization = result_json["diarization"]
        speaker_transcript = result_json["transcription"]
    else:
        logger.info("No cached result, creating new Celery task.")
        logger.info("Processing started")
        diarization, transcription, speaker_transcript = await diaratize_and_transcript_audio(audio_content, audio_filename)
        logger.info("Processing completed")

    return {
        "filehash": filehash,
        "speaker_transcript": speaker_transcript,
        "diarization": diarization
    }

