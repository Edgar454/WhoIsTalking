"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ConversationDisplayProps {
  transcription: Record<string, string[]>
  diarization: Record<string, [number, number][]>
  currentTime: number
  isPlaying: boolean
}

interface Message {
  speakerId: string
  text: string
  startTime: number
  endTime: number
}

// Generate a color for each speaker (matching waveform colors)
const getSpeakerColor = (speakerId: string) => {
  const colors = {
    SPEAKER_00: "#10b981", // Green
    SPEAKER_01: "#3b82f6", // Blue
    SPEAKER_02: "#ec4899", // Pink
    SPEAKER_03: "#f59e0b", // Amber
    SPEAKER_04: "#8b5cf6", // Purple
  }

  return colors[speakerId as keyof typeof colors] || "#6b7280"
}

export default function ConversationDisplay({
  transcription,
  diarization,
  currentTime,
  isPlaying,
}: ConversationDisplayProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [activeMessageIndex, setActiveMessageIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<(HTMLDivElement | null)[]>([])

  // Process transcription and diarization data to create messages
  useEffect(() => {
    const processedMessages: Message[] = []

    Object.entries(transcription).forEach(([speakerId, texts]) => {
      const speakerSegments = diarization[speakerId] || []

      texts.forEach((text, index) => {
        if (speakerSegments[index]) {
          const [startTime, endTime] = speakerSegments[index]
          processedMessages.push({
            speakerId,
            text,
            startTime,
            endTime,
          })
        }
      })
    })

    // Sort messages by start time
    processedMessages.sort((a, b) => a.startTime - b.startTime)
    setMessages(processedMessages)

    // Initialize message refs array
    messageRefs.current = processedMessages.map(() => null)
  }, [transcription, diarization])

  // Update active message based on current time
  useEffect(() => {
    const activeIndex = messages.findIndex(
      (message) => currentTime >= message.startTime && currentTime <= message.endTime,
    )

    if (activeIndex !== -1 && activeIndex !== activeMessageIndex) {
      setActiveMessageIndex(activeIndex)

      // Scroll to active message if playing
      if (isPlaying && messageRefs.current[activeIndex]) {
        messageRefs.current[activeIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }, [currentTime, messages, isPlaying, activeMessageIndex])

  // Get speaker name (for display purposes)
  const getSpeakerName = (speakerId: string) => {
    const names = {
      SPEAKER_00: "Speaker A",
      SPEAKER_01: "Speaker B",
      SPEAKER_02: "Speaker C",
      SPEAKER_03: "Speaker D",
      SPEAKER_04: "Speaker E",
    }

    return names[speakerId as keyof typeof names] || speakerId.replace("_", " ")
  }

  return (
    <div className="w-full bg-gradient-to-b from-zinc-900 to-black rounded-xl border border-green-900/50 shadow-lg shadow-green-900/20 overflow-hidden">
      <div className="p-4 border-b border-green-900/30 bg-black/50">
        <h2 className="text-xl font-semibold text-green-400">Conversation</h2>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-4">
          {messages.map((message, index) => {
            const isActive = index === activeMessageIndex
            const isSelf = message.speakerId === "SPEAKER_00"
            const speakerColor = getSpeakerColor(message.speakerId)

            return (
              <div
                key={`${message.speakerId}-${index}`}
                ref={(el) => (messageRefs.current[index] = el)}
                className={`flex ${isSelf ? "justify-end" : "justify-start"} transition-all duration-300 ${
                  isActive ? "scale-105" : "scale-100"
                }`}
              >
                <div
                  className={`
                    max-w-[80%] p-4 rounded-xl shadow-md
                    ${isSelf ? "rounded-tr-none" : "rounded-tl-none"}
                    transition-all duration-300
                  `}
                  style={{
                    backgroundColor: isActive ? `${speakerColor}30` : "rgba(0, 0, 0, 0.5)",
                    borderLeft: !isSelf ? `4px solid ${speakerColor}` : "none",
                    borderRight: isSelf ? `4px solid ${speakerColor}` : "none",
                    boxShadow: isActive ? `0 0 15px ${speakerColor}40` : "none",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${speakerColor}20`,
                        color: speakerColor,
                      }}
                    >
                      {getSpeakerName(message.speakerId)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {`${Math.floor(message.startTime / 60)}:${Math.floor(message.startTime % 60)
                        .toString()
                        .padStart(2, "0")}`}
                    </span>
                  </div>
                  <p className={`text-sm ${isActive ? "text-white" : "text-zinc-300"}`}>{message.text}</p>
                </div>
              </div>
            )
          })}

          {messages.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <p className="text-zinc-600">No conversation data available</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
