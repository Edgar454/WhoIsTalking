# Who Is Talking?

*Who is Talking* is an application designed to analyze and decompose audio conversations. By using an audio file, the app identifies who is speaking, when they speak, and what they are saying.

The application utilizes two AI models:
1. **Speaker Diarization Model** – to identify who is speaking.
2. **Transcription Model** – to transcribe what is being said.

---

## Table of Contents
1. [Installation](#installation)
2. [Deployment](#deployment)
3. [Running the Application](#running-the-application)
4. [Demo](#demo)

---

## Installation

### Prerequisites

Before installing the application, you need to deploy a **Speaker Diarization Model**. The app uses **Baseten** to deploy the model as an API, but you can use any service of your choice. If you want to use **Baseten**, refer to the `speaker-diary` folder for a configuration template.

- **Baseten Setup**: Learn more about deploying models on Baseten [here](https://docs.baseten.co/overview).
- **GroqAPI Key**: You will also need a **GroqAPI key** to access the **Whisper** transcription model. Refer to the Groq documentation [here](https://console.groq.com/docs/overview).

### Configuration

1. **Obtain API Keys**:
   - **Baseten API Key**: If you're using Baseten, sign up and generate an API key.
   - **Groq API Key**: Sign up at Groq and get the necessary key to access the Whisper model.

2. **Create `.env` File**:
   After obtaining the API keys, create a `.env` file in the root directory of the project with the following content:
   ```env
   GROQ_API_KEY=<your_groq_api_key>
   BASETEN_API_KEY=<your_baseten_api_key>
   ```

Once you've set up the API keys, you are ready to proceed!

---

## Deployment

### Docker Setup (Recommended)

The easiest way to run the app is through Docker. It takes care of all dependencies and configurations for you.

1. Navigate to the root directory of the project.
2. Run the following command to start the application in detached mode:
   ```bash
   docker-compose up -d
   ```

This command will launch the application and its services (FastAPI, Celery, Redis) using Docker. 

> **Note:** It's recommended to use the Docker setup as it simplifies the process, but you can also install and run the components individually if you prefer.

---

## Running the Application (Without Docker)

### 1. Start Celery Worker

The app uses **Celery** for background task processing. Start the Celery worker by navigating to the `whoisspeaking/src` folder and running:

```bash
celery -A whoisspeaking.celery_worker worker --loglevel=info
```

### 2. Install Dependencies

In the same folder, install the necessary dependencies using **Poetry**:

```bash
pip install poetry
poetry install
```

### 3. Start FastAPI Server

Once the dependencies are installed, launch the FastAPI server:

```bash
uvicorn whoisspeaking.app:app --reload
```

### 4. Start the Frontend

Navigate back to the `audio-analyzer` folder and install the frontend dependencies:

```bash
npm install
npm start
```

Now you can access the app at [http://localhost:3000](http://localhost:3000).

---

## Demo

You can find a demo of the application here: 
<video width="600" controls>
  <source src="./demo/demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

---

### Notes:

- **Docker-based Setup**: If you're not familiar with Docker, it's highly recommended to use it for a smoother setup. It handles the dependencies and environment configurations automatically.
- **Celery**: Make sure to start the Celery worker first, as it handles background tasks like audio processing.
- **FastAPI**: This handles the main backend logic for the app.

---

Feel free to reach out if you have any questions or issues! Happy coding! 😊
