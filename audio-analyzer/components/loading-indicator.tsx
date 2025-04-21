"use client"

export default function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-20 h-20">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-green-500/20 rounded-full"></div>

        {/* Spinning ring */}
        <div className="absolute inset-0 border-t-4 border-green-500 rounded-full animate-spin"></div>

        {/* Inner pulsing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-green-500/20 rounded-full animate-pulse"></div>
        </div>

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>

        {/* Orbiting dot */}
        <div className="absolute top-0 left-1/2 w-3 h-3 -ml-1.5 bg-green-400 rounded-full animate-orbit"></div>
      </div>

      <style jsx>{`
        @keyframes orbit {
          0% { transform: rotate(0deg) translateY(-12px) rotate(0deg); }
          100% { transform: rotate(360deg) translateY(-12px) rotate(-360deg); }
        }
        .animate-orbit {
          animation: orbit 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
