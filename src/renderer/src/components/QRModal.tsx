import { useEffect, useRef } from "react"
import QRCode from "react-qr-code"
import { Xicon } from "./icons"

interface QRModalProps {
  onClose: () => void
  serverAddress: string
}

export default function QRModal ({ onClose, serverAddress }: QRModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose, serverAddress])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg transition-colors duration-300 relative max-w-md w-full"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Xicon />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">QR Code</h2>
        <div className="flex justify-center mb-4">
          <QRCode value={serverAddress} size={198} />
        </div>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400 text-center">
          Scan this QR code to access the client page for file transfers.
        </p>
        <p className="text-sm font-semibold text-center break-all">{serverAddress}</p>
      </div>
    </div>
  )
}

