import { useState, useEffect } from "react"

interface Transfer {
  id: number
  user: string
  fileName: string
  progress: number
  speed: string
  totalSize: string
}

export default function TransferList () {
  const [transfers, setTransfers] = useState<Transfer[]>([])

  useEffect(() => {
    // Simulating data fetch
    const mockTransfers: Transfer[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      user: `User ${i + 1}`,
      fileName: `file_${i + 1}.zip`,
      progress: Math.random() * 100,
      speed: `${(Math.random() * 10).toFixed(2)} MB/s`,
      totalSize: `${(Math.random() * 1000).toFixed(2)} MB`,
    }))
    setTransfers(mockTransfers)
  }, [])

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
          <div key={transfer.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors duration-300">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">{transfer.user}</span>
              <span>{transfer.fileName}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${transfer.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span>{transfer.progress.toFixed(2)}%</span>
              <span>{transfer.speed}</span>
              <span>{transfer.totalSize}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

