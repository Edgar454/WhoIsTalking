from whoisspeaking.utils import get_redis_connection
import asyncio
import json
from fastapi import WebSocket, WebSocketDisconnect

async def listen_to_redis_channel(websocket: WebSocket, task_id: str):
    """
    Listens to the Redis Pub/Sub channel for updates and sends messages to the client.
    """
    redis = await get_redis_connection()

    # Create a Pub/Sub object and subscribe to the Redis channel
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"task_status_channel:{task_id}")

    try:
        while True:
            # Get the next message from the Redis Pub/Sub channel
            message = await pubsub.get_message(ignore_subscribe_messages=True)
            if message:
                # Process the message (task result)
                task_result = json.loads(message['data'])
                await websocket.send_text(json.dumps(task_result))  # Send result to WebSocket client
                break  # Close connection after sending the result

            # Poll every 1 second to check for new messages
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print(f"Client disconnected: {task_id}")
        await pubsub.unsubscribe(f"task_status_channel:{task_id}")
        await redis.close()
