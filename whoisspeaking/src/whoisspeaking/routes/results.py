from fastapi import APIRouter, WebSocket
from whoisspeaking.websocket.socket import listen_to_redis_channel


router = APIRouter()

@router.websocket("/ws/task/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    # Accept WebSocket connection
    await websocket.accept()

    try:
        # Start listening for task updates from Redis
        await listen_to_redis_channel(websocket, task_id)
    except Exception as e:
        print(f"Error in WebSocket: {e}")
        await websocket.close()
