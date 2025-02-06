import { useState, useEffect } from "react"

export default function UserList () {
  const [users, setUsers] = useState<[]>([])

  useEffect(() => {
    const handleDivesUpdate = (_event, devices) => {
      setUsers(devices)
    }

    window.electron.ipcRenderer.on('devices', handleDivesUpdate)

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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        Connected Users
      </h2>
      <div className="h-64 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b dark:border-gray-700">
              <th className="pb-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {/* FIXME: Arreglar que no sea con index */}
            {users.map((user, index) => (
              <tr key={index} className="border-b dark:border-gray-700">
                <td className="py-2">{user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

