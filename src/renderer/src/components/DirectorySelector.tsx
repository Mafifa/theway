import { useState, useRef, useEffect } from "react"

export default function DirectorySelector () {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setSelectedPath(files[0].webkitRelativePath.split("/")[0])
      setShowTooltip(true)

      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }

      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false)
      }, 3000)
    }
  }

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <button
        onClick={handleFileSelect}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300"
        title="Select directory for file storage"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        // @ts-ignore
        webkitdirectory=""
        directory=""
      />
      {showTooltip && selectedPath && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded shadow-md text-sm">
          Selected: {selectedPath}
        </div>
      )}
    </div>
  )
}

