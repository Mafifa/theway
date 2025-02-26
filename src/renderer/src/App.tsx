import { useState, useEffect } from "react"
import ServerStatus from "./components/ServerStatus"
import UserList from "./components/UserList"
import TransferList from "./components/TransferList"
import QRModal from "./components/QRModal"
import DirectorySelector from "./components/DirectorySelector"
import { Moon, QRcode, Sun } from "./components/icons"


type Users = string[]

export default function App () {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isServerOn, setIsServerOn] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [serverAddress, setServerAddress] = useState('')
  const [users, setUsers] = useState<Users>([])


  useEffect(() => {
    const handleDivesUpdate = (_event, devices) => {
      setUsers(devices)
    }

    window.electron.ipcRenderer.on('devices', handleDivesUpdate)
  }, [])


  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark))
  }, [])



  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode)
  }

  const handleServer = async () => {
    await window.electron.ipcRenderer.invoke('on-off').then((response) => {
      if (response === false) {
        setIsServerOn(false)
      } else {
        setIsServerOn(true)
        setServerAddress(response.red)
      }
    })
  }

  return (
    <main className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">TheWay Server Monitor</h1>
          <div className="flex items-center space-x-4">
            <DirectorySelector />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun />
              ) : (
                <Moon />
              )}
            </button>
            <button
              onClick={() => setShowQRModal(true)}
              disabled={!isServerOn}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Show QR code for client page"
            >
              <QRcode />
              <span>Show QR</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <ServerStatus isOn={isServerOn} setIsOn={handleServer} serverAddress={serverAddress} />
            <UserList users={users} />
          </div>
          <TransferList />
        </div>
      </div>

      {showQRModal && <QRModal onClose={() => setShowQRModal(false)} serverAddress={serverAddress} />}
    </main>
  )
}

