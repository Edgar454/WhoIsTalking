"use client"

import type React from "react"

import { useState, useRef , useCallback } from "react"
import { uploadAudio, getTaskStatus, getTaskResult } from "@/lib/api"
import WaveformPlayer from "@/components/waveform-player"
import ConversationDisplay from "@/components/conversation-display"
import LoadingIndicator from "@/components/loading-indicator"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowUpFromLine, RotateCcw } from "lucide-react"

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [fileId, setFileId] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    setAudioFile(file)
    setAudioUrl(URL.createObjectURL(file))
    setIsProcessing(true)

    try {
      const response = await uploadAudio(file)
      setTaskId(response.task_id)
      setFileId(response.file_id)

      // Start polling for task status
      pollingIntervalRef.current = setInterval(async () => {
        if (!response.task_id) return

        const statusResponse = await getTaskStatus(response.task_id)
        if (statusResponse.status === "Success") {
          clearInterval(pollingIntervalRef.current!)
          console.log(response.file_id)
          const result = await getTaskResult(response.file_id)
          setAnalysisResult(result)
          setIsProcessing(false)
        }
      }, 2000)
    } catch (error) {
      console.error("Error uploading file:", error)
      setIsProcessing(false)
    }
  }

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])
  
  const handlePlayPause = useCallback((playing: boolean) => {
    setIsPlaying(playing)
  }, [])

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleReset = () => {
    setAudioFile(null)
    setAudioUrl(null)
    setAnalysisResult(null)
    setTaskId(null)
    setFileId(null)
    setCurrentTime(0)
    setIsPlaying(false)
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-green-400">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,100,0,0.1),transparent_70%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0),rgba(0,255,0,0.05),rgba(0,0,0,0))] pointer-events-none"></div>

      <div className="w-full max-w-4xl p-4 flex flex-col items-center relative z-10">
        <h1 className="text-4xl font-bold mb-2 mt-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
          Audio Conversation Analyzer
        </h1>
        <p className="text-green-600 mb-8 text-center">Visualize and analyze speaker conversations with AI</p>

        {!audioFile ? (
          <div className="w-full flex flex-col items-center justify-center py-10 relative">
            <div className="absolute inset-0 border-2 border-dashed border-green-800 rounded-xl opacity-50"></div>
            <div className="relative z-10 flex flex-col items-center">
              <Button
                onClick={handleButtonClick}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black font-bold py-6 px-8 rounded-xl shadow-lg shadow-green-900/30 transition-all hover:scale-105"
                size="lg"
              >
                <ArrowUpFromLine className="mr-2 h-6 w-6" />
                Upload Audio File
              </Button>
              <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileChange} />
              <p className="mt-4 text-green-600 text-sm">or drag and drop an audio file anywhere on this area</p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex justify-between items-center mb-6 bg-zinc-900/50 p-3 rounded-lg border border-green-900/50 backdrop-blur-sm">
              <div>
                <p className="text-green-400 font-medium truncate max-w-[250px]">{audioFile.name}</p>
                <p className="text-green-700 text-xs">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-green-700 text-green-500 hover:bg-green-900/50 hover:text-green-400"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="w-full flex flex-col items-center justify-center py-10">
            <LoadingIndicator />
            <p className="mt-4 text-green-400 animate-pulse">Processing your audio file...</p>
          </div>
        )}

        {audioUrl && analysisResult && (
          <div className="w-full space-y-6 animate-fadeIn">
            <WaveformPlayer
              audioUrl={audioUrl}
              diarization={analysisResult.diarization}
              onTimeUpdate={handleTimeUpdate}
              onPlayPause={handlePlayPause}
            />

            <ConversationDisplay
              transcription={analysisResult.transcription}
              diarization={analysisResult.diarization}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />
          </div>
        )}
      </div>

      <div className="flex-grow"></div>
      <Footer />
    </main>
  )
}
