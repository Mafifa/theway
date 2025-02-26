import { ipcMain } from 'electron'
import { formatFileSize } from '../utils/utils'

const activeUploads = new Map()

export const handleFileUpload = (req, res, _io, connectedDevices) => {
  const clientIP = req.ip.replace('::ffff:', '')
  connectedDevices.add(clientIP)

  const file = req.file
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded.' })
  }

  console.log(`File received from ${clientIP}:`, file.originalname)

  const uploadId = `${clientIP}-${Date.now()}`
  activeUploads.set(uploadId, {
    id: uploadId,
    clientIP,
    progress: 0,
    speed: '0 B/s',
    uploaded: '0 B',
    fileName: file.originalname,
    total: formatFileSize(file.size),
    status: 'in-progress'
  })

  res.json({
    message: 'File upload started.',
    filename: file.originalname,
    uploadId: uploadId
  })

  ipcMain.emit('update-active-uploads', getActiveUploads())
}

export const calculateSpeed = (bytesUploaded, startTime) => {
  const elapsedTime = (Date.now() - startTime) / 1000 // Time in seconds
  return bytesUploaded / elapsedTime // bytes per second
}

export const uploadProgressMiddleware = (io) => {
  return (req, _res, next) => {
    const startTime = Date.now()
    let lastLogTime = startTime
    let bytesUploaded = 0
    const fileSize = Number.parseInt(req.headers['content-length'], 10)
    const clientIP = req.ip.replace('::ffff:', '')
    const socketId = req.headers['x-socket-id']
    const fileName = decodeURIComponent(req.headers['x-file-name'] as string)
    const uploadId = req.headers['x-upload-id'] as string

    if (!socketId || !uploadId) {
      console.warn('Socket ID or Upload ID not provided in the request.')
      return next()
    }

    if (!activeUploads.has(uploadId)) {
      activeUploads.set(uploadId, {
        id: uploadId,
        clientIP,
        progress: 0,
        speed: '0 B/s',
        uploaded: '0 B',
        fileName: fileName || 'Unnamed file',
        total: formatFileSize(fileSize),
        status: 'in-progress'
      })
    }

    req.on('data', (chunk) => {
      bytesUploaded += chunk.length
      const now = Date.now()

      if (now - lastLogTime >= 1000) {
        const progress = (bytesUploaded / fileSize) * 100
        const speed = calculateSpeed(bytesUploaded, startTime)

        const updatedUpload = {
          id: uploadId,
          clientIP,
          progress: progress.toFixed(2),
          speed: formatFileSize(speed) + '/s',
          uploaded: formatFileSize(bytesUploaded),
          fileName: fileName || 'Unnamed file',
          total: formatFileSize(fileSize),
          status: 'in-progress'
        }

        activeUploads.set(uploadId, updatedUpload)

        console.log(`Loading progress (${uploadId}):`, progress.toFixed(2) + '%')

        io.to(socketId).emit('uploadProgress', {
          uploadId,
          progress: progress.toFixed(2),
          speed: formatFileSize(speed) + '/s',
          uploaded: formatFileSize(bytesUploaded),
          total: formatFileSize(fileSize)
        })

        ipcMain.emit('update-active-uploads', getActiveUploads())

        lastLogTime = now
      }
    })

    req.on('end', () => {
      console.log(`Upload completed (${uploadId})`)

      activeUploads.set(uploadId, {
        ...activeUploads.get(uploadId),
        progress: '100',
        status: 'completed'
      })

      ipcMain.emit('update-active-uploads', getActiveUploads())

      // Remove completed upload after a short delay
      setTimeout(() => {
        activeUploads.delete(uploadId)
        ipcMain.emit('update-active-uploads', getActiveUploads())
      }, 5000)
    })

    next()
  }
}

export const getActiveUploads = () => {
  console.log('Getting active uploads')
  console.log('Active uploads map size:', activeUploads.size)

  try {
    const uploads = Array.from(activeUploads.values())
    return uploads
  } catch (error) {
    console.error('Error getting active uploads:', error)
    return []
  }
}

export const cleanupActiveUploads = () => {
  const now = Date.now()
  for (const [id, upload] of activeUploads.entries()) {
    if (upload.status === 'completed' || now - Number.parseInt(id.split('-')[1]) > 3600000) {
      activeUploads.delete(id)
    }
  }
  ipcMain.emit('update-active-uploads', getActiveUploads())
}

setInterval(cleanupActiveUploads, 60000) // Run cleanup every minute
