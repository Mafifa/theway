import { useState, useEffect } from "react"

interface Transfer {
  id: string
  clientIP: string
  progress: number
  speed: string
  uploaded: string
  fileName: string
  total: string
  status: string
}

export default function TransferList () {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleTransfers = (_event, data: Transfer[]) => {
      console.log("Received transfers:", data)
      if (Array.isArray(data)) {
        setTransfers(data)
      } else {
        console.error("Received non-array data:", data)
        setTransfers([])
      }
      setLoading(false)
    }

    const fetchInitialTransfers = async () => {
      try {
        if (window.electron && window.electron.ipcRenderer) {
          const initialTransfers = await window.electron.ipcRenderer.invoke("get-active-uploads")
          console.log("Initial transfers:", initialTransfers)
          if (Array.isArray(initialTransfers)) {
            setTransfers(initialTransfers)
          } else {
            console.error("Received non-array initial transfers:", initialTransfers)
            setTransfers([])
          }
          setLoading(false)

          window.electron.ipcRenderer.on("active-uploads", handleTransfers)
        } else {
          throw new Error("window.electron.ipcRenderer is not available")
        }
      } catch (err) {
        console.error("Error fetching initial transfers:", err)
        setError("Failed to load transfers")
        setTransfers([])
        setLoading(false)
      }
    }

    fetchInitialTransfers()

    return () => {
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.removeListener("active-uploads", handleTransfers)
      }
    }
  }, [])

  if (loading) {
    return <div>Waiting...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        Active Transfers
      </h2>
      <div className="h-96 overflow-y-auto space-y-4">
        {transfers.map((transfer) => (
          <div
            key={transfer.id}
            className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors duration-300"
          >
            <div className="flex justify-between mb-2">
              <span className="font-semibold">{transfer.clientIP}</span>
              <span>{transfer.fileName.slice(0, 40)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${transfer.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span>{transfer.progress}%</span>
              <span>{transfer.speed}</span>
              <span>{transfer.total}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
