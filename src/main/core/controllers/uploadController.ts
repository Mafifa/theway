import { ipcMain } from 'electron'
import { formatFileSize } from '../utils/utils'

const activeUploads = new Map()

export const handleFileUpload = (req, res, _io, connectedDevices) => {
  const clientIP = req.ip.replace('::ffff:', '')
  connectedDevices.add(clientIP)

  const file = req.file
  if (!file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo.' })
  }

  console.log(`Archivo recibido de ${clientIP}:`, file.originalname)

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
    message: 'Archivo subido exitosamente.',
    filename: file.originalname
  })

  ipcMain.emit('update-active-uploads', getActiveUploads())
}

export const calculateSpeed = (bytesUploaded, startTime) => {
  const elapsedTime = (Date.now() - startTime) / 1000 // tiempo en segundos
  return bytesUploaded / elapsedTime // bytes por segundo
}

export const uploadProgressMiddleware = (io) => {
  return (req, _res, next) => {
    const startTime = Date.now()
    let lastLogTime = startTime
    let bytesUploaded = 0
    const fileSize = Number.parseInt(req.headers['content-length'], 10)
    const clientIP = req.ip.replace('::ffff:', '')
    const socketId = req.headers['x-socket-id']

    if (!socketId) {
      console.warn('No se proporcionó un socket ID en la solicitud.')
      return next()
    }

    const uploadId = `${clientIP}-${Date.now()}`

    req.on('data', (chunk) => {
      bytesUploaded += chunk.length
      const now = Date.now()

      if (now - lastLogTime >= 1000) {
        const progress = (bytesUploaded / fileSize) * 100
        const speed = calculateSpeed(bytesUploaded, startTime)

        activeUploads.set(uploadId, {
          id: uploadId,
          clientIP,
          progress: progress.toFixed(2),
          speed: formatFileSize(speed) + '/s',
          uploaded: formatFileSize(bytesUploaded),
          fileName: req.file ? req.file.originalname : 'Archivo desconocido',
          total: formatFileSize(fileSize),
          status: 'in-progress'
        })

        console.log(`Progreso de carga (${uploadId}):`, progress.toFixed(2) + '%')

        io.to(socketId).emit('uploadProgress', {
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
      console.log(`Carga completada (${uploadId})`)

      activeUploads.set(uploadId, {
        ...activeUploads.get(uploadId),
        progress: '100',
        status: 'completed'
      })

      ipcMain.emit('update-active-uploads', getActiveUploads())
    })

    next()
  }
}

export const getActiveUploads = () => {
  console.log('Getting active uploads')
  console.log('Active uploads map size:', activeUploads.size)

  try {
    const uploads = Array.from(activeUploads.values())
    console.log('Active uploads:', uploads)
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
}

setInterval(cleanupActiveUploads, 3600000)
