from fastapi import APIRouter, HTTPException
import aioredis
import json

router = APIRouter()

# Configurer Redis
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0

async def get_redis_connection():
    return await aioredis.create_redis_pool((REDIS_HOST, REDIS_PORT), db=REDIS_DB)


