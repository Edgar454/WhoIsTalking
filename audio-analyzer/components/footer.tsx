import { Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full py-4 border-t border-green-900/30 mt-auto relative z-10">
      <div className="container mx-auto flex justify-center items-center">
        <div className="bg-black/50 px-4 py-2 rounded-full border border-green-900/30 flex items-center">
          <p className="text-sm text-green-500 mr-2">Made by Edgar</p>
          <a
            href="https://github.com/edgar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 transition-colors"
            aria-label="GitHub"
          >
            <Github size={18} />
          </a>
        </div>
      </div>
    </footer>
  )
}
