import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Folder } from "./icons"

export default function DirectorySelector () {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDirectorySelect = () => {
    directoryInputRef.current?.click()
  }

  const handleDirectoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const path = files[0].webkitRelativePath || files[0].name
      setSelectedPath(path.split("/")[0])
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
        onClick={handleDirectorySelect}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300"
        title="Select directory for file storage"
      >
        <Folder />
      </button>
      <input
        type="file"
        ref={directoryInputRef}
        onChange={handleDirectoryChange}
        style={{ display: "none" }}
        // eslint-disable-next-line @typescript-eslint/ban-types
        {...({ directory: "", webkitdirectory: "" } as {})}
      />
      {showTooltip && selectedPath && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded shadow-md text-sm">
          Selected: {selectedPath}
        </div>
      )}
    </div>
  )
}

