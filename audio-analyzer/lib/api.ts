import axios from "axios"

const BASE_URL = "http://localhost:8000" // adjust if deployed elsewhere

// 1. Upload audio file


export async function uploadAudio(file: File) {
  const formData = new FormData()
  formData.append("audio", file)

  console.log("🟡 Starting uploadAudio call")
  console.log("📦 File details:", {
    name: file.name,
    type: file.type,
    size: file.size,
  })

  console.log("🌍 API Endpoint:", `${BASE_URL}/process-audio/`)

  try {
    const response = await axios.post(`${BASE_URL}/process-audio/`, formData, {
      headers: {
        // You can comment this out to test Axios auto-set behavior
        "Content-Type": "multipart/form-data",
      },
    })

    console.log("✅ Upload successful:", response.data)
    return response.data // { message, task_id, file_id }

  } catch (error: any) {
    console.error("❌ Upload failed!")

    if (axios.isAxiosError(error)) {
      console.error("📡 Axios error message:", error.message)
      console.error("📄 Axios error config:", error.config)

      if (error.response) {
        console.error("🔴 Server responded with non-2xx code")
        console.error("Status:", error.response.status)
        console.error("Data:", error.response.data)
      } else if (error.request) {
        console.error("🚫 No response received. Possible network issue or CORS.")
        console.error("Request details:", error.request)
      } else {
        console.error("⚠️ Other Axios error:", error.message)
      }
    } else {
      console.error("🧨 Non-Axios error:", error)
    }

    throw error
  }
}


// 2. Polling: check task status
export async function getTaskStatus(taskId: string) {
  const response = await axios.get(`${BASE_URL}/task-status/${taskId}`)
  return response.data // returns { status }
}

// 3. Get final result using filehash
export async function getTaskResult(filehash: string) {
  const response = await axios.get(`${BASE_URL}/get-task-result/?filehash=${filehash}`)
  return response.data
}

// 4. Optional: WebSocket listener
export function listenToTaskWebSocket(taskId: string, onMessage: (data: any) => void) {
  const socket = new WebSocket(`ws://localhost:8000/ws/task/${taskId}`)

  socket.onopen = () => {
    console.log(`WebSocket connected for task ${taskId}`)
  }

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log("Received WebSocket message:", data)
    onMessage(data) // callback to update UI
  }

  socket.onerror = (error) => {
    console.error("WebSocket error:", error)
  }

  socket.onclose = () => {
    console.log(`WebSocket closed for task ${taskId}`)
  }

  return socket
}

export const waitForResult = async (fileId: string, maxRetries = 10, delayMs = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await getTaskResult(fileId)
      return result
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Wait and retry
        await new Promise(res => setTimeout(res, delayMs))
      } else {
        throw error // Rethrow other errors
      }
    }
  }
  throw new Error("Result not available after multiple retries")
}
