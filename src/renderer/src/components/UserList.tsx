import { Users } from "./icons";

type Users = string[]

export default function UserList ({ users }: { users: Users }) {

  console.log(users);


  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Users />
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

            {users.map((user) => (
              <tr key={user} className="border-b dark:border-gray-700">
                <td className="py-2">{user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
