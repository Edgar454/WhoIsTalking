from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from whoisspeaking.routes import tasks ,results

app = FastAPI()

@app.get("/")
async def root():
    """
    Root endpoint.
    """
    return {"message": "Welcome !"}

app.include_router(tasks.router)
app.include_router(results.router)

# Add  middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
