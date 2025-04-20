from fastapi import FastAPI
from whoisspeaking.routes import tasks 
app = FastAPI()

@app.get("/")
async def root():
    """
    Root endpoint.
    """
    return {"message": "Welcome !"}

app.include_router(tasks.router)