import { useState, useEffect } from "react"

interface User {
  id: number
  ip: string
  mac: string
}

export default function UserList () {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    // Simulating data fetch
    const mockUsers: User[] = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      ip: `192.168.1.${i + 1}`,
      mac: `00:1B:44:11:3A:${i < 10 ? "0" + i : i}`,
    }))
    setUsers(mockUsers)
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
              <th className="pb-2">MAC</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b dark:border-gray-700">
                <td className="py-2">{user.ip}</td>
                <td className="py-2">{user.mac}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

