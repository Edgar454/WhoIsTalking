"use client"

import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js"
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface WaveformPlayerProps {
  audioUrl: string
  diarization: Record<string, [number, number][]>
  onTimeUpdate: (time: number) => void
  onPlayPause: (isPlaying: boolean) => void
}



// Generate a color for each speaker
const getSpeakerColor = (speakerId: string) => {
  const colors = {
    SPEAKER_00: "rgba(16, 185, 129, 0.5)", // Green
    SPEAKER_01: "rgba(59, 130, 246, 0.5)", // Blue
    SPEAKER_02: "rgba(236, 72, 153, 0.5)", // Pink
    SPEAKER_03: "rgba(245, 158, 11, 0.5)", // Amber
    SPEAKER_04: "rgba(139, 92, 246, 0.5)", // Purple
  }

  return colors[speakerId as keyof typeof colors] || "rgba(128, 128, 128, 0.5)"
}

export default function WaveformPlayer({ audioUrl, diarization, onTimeUpdate, onPlayPause }: WaveformPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(75)


  useEffect(() => {
    if (!waveformRef.current) return

    console.log("🔵 COMPONENT MOUNTED");
    
    const controller = new AbortController()
    const signal = controller.signal
  
    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "rgba(16, 185, 129, 0.4)",
      progressColor: "#10b981",
      cursorColor: "#f0fdf4",
      barWidth: 3,
      barGap: 2,
      barRadius: 4,
      height: 100,
      normalize: true,
      plugins: [RegionsPlugin.create()],
    })
  
    // Link destroy with abort
    wavesurfer.on("destroy", () => {
      controller.abort()
    })

  
    // Load audio with abort signal
    fetch(audioUrl, { signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.blob()
      })
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob)
        wavesurfer.load(objectUrl)
      })
      .catch(error => {
        if (error.name === "AbortError") {
          console.log(audioUrl)
          console.log("Audio loading aborted")
        } else {
          console.error("Error loading audio:", error)
        }
      })
  
    // Event listeners
    wavesurfer.on("ready", () => {
      setDuration(wavesurfer.getDuration())
      wavesurfer.setVolume(volume / 100)
  
      Object.entries(diarization).forEach(([speakerId, segments]) => {
        segments.forEach(([start, end]) => {
          wavesurfer.plugins[0].addRegion({
            start,
            end,
            color: getSpeakerColor(speakerId),
            drag: false,
            resize: false,
            id: `${speakerId}-${start}-${end}`,
          })
        })
      })
    })
  
    wavesurfer.on("audioprocess", () => {
      const currentTime = wavesurfer.getCurrentTime()
      setCurrentTime(currentTime)
      onTimeUpdate(currentTime)
    })
  
    wavesurfer.on("play", () => {
      setIsPlaying(true)
      onPlayPause(true)
    })
  
    wavesurfer.on("pause", () => {
      setIsPlaying(false)
      onPlayPause(false)
    })
  
    wavesurferRef.current = wavesurfer
  
    return () => {
      console.log("🔴 COMPONENT UNMOUNTED");
      wavesurfer.destroy()
    }
  }, [audioUrl, diarization, onTimeUpdate, onPlayPause, volume])
  


  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause()
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const skipBackward = () => {
    if (!wavesurferRef.current) return

    const newTime = Math.max(0, currentTime - 5)
    wavesurferRef.current.seekTo(newTime / duration)
    setCurrentTime(newTime)
    onTimeUpdate(newTime)
  }

  const skipForward = () => {
    if (!wavesurferRef.current) return

    const newTime = Math.min(duration, currentTime + 5)
    wavesurferRef.current.seekTo(newTime / duration)
    setCurrentTime(newTime)
    onTimeUpdate(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume / 100)
    }
  }

  return (
    <div className="w-full bg-gradient-to-b from-zinc-900 to-black rounded-xl p-6 border border-green-900/50 shadow-lg shadow-green-900/20">
      <div className="relative mb-6">
        <div ref={waveformRef} className="relative z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-900/10 to-transparent pointer-events-none z-0"></div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-mono bg-black/50 px-3 py-1 rounded-full border border-green-900/30">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-green-600" />
          <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="w-24" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-green-800 bg-black/50 hover:bg-green-900/30 hover:border-green-600"
          onClick={skipBackward}
        >
          <SkipBack className="h-5 w-5 text-green-500" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-14 h-14 border-green-700 bg-black/50 hover:bg-green-900/30 hover:border-green-500"
          onClick={togglePlayPause}
        >
          {isPlaying ? <Pause className="h-7 w-7 text-green-400" /> : <Play className="h-7 w-7 text-green-400 ml-1" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-green-800 bg-black/50 hover:bg-green-900/30 hover:border-green-600"
          onClick={skipForward}
        >
          <SkipForward className="h-5 w-5 text-green-500" />
        </Button>
      </div>

      <div className="mt-6 flex justify-center gap-6 flex-wrap">
        {Object.entries(diarization).map(([speakerId, segments]) => (
          <div
            key={speakerId}
            className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full border border-green-900/30"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getSpeakerColor(speakerId).replace(/[^,]+\)/, "1)") }}
            />
            <span className="text-xs text-green-400">{speakerId.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
