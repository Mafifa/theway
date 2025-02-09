import type { Dispatch, SetStateAction } from 'react'

interface ServerStatusProps {
  isOn: boolean
  setIsOn: Dispatch<SetStateAction<boolean>>
  serverAddress: string
}

export default function ServerStatus ({ isOn, setIsOn, serverAddress }: ServerStatusProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-4 h-4 rounded-full ${isOn ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h2 className="text-xl font-semibold">Server Status: {isOn ? 'Online' : 'Offline'}</h2>
        </div>
        <div className="flex items-center space-x-4">
          {isOn && (
            <span className="text-sm text-gray-600 dark:text-gray-400">{serverAddress}</span>
          )}
          <button
            onClick={() => setIsOn(!isOn)}
            className={`px-4 py-2 rounded-lg text-white transition-colors duration-300 flex items-center space-x-2 ${isOn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            <span>{isOn ? 'Turn Off' : 'Turn On'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
