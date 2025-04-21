"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AudioUploadProps {
  onFileUpload: (file: File) => void
}

export default function AudioUpload({ onFileUpload }: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("audio/")) {
        onFileUpload(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full flex flex-col items-center">
      <Button
        onClick={handleButtonClick}
        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black font-bold py-6 px-8 rounded-xl shadow-lg shadow-green-900/30 transition-all hover:scale-105"
        size="lg"
      >
        <Upload className="mr-2 h-6 w-6" />
        Upload Audio File
      </Button>
      <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileChange} />
      <p className="mt-4 text-green-600 text-sm">or drag and drop an audio file</p>
    </div>
  )
}
