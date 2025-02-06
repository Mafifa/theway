import { BrowserWindow } from 'electron'
import { formatFileSize } from '../utils/utils'

const allWindows = BrowserWindow.getAllWindows()

const activeUploads = new Map()

export const handleFileUpload = (req, res, _io, connectedDevices) => {
  const clientIP = req.ip.replace('::ffff:', '')
  connectedDevices.add(clientIP)

  const file = req.file
  if (!file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo.' })
  }

  console.log(`Archivo recibido de ${clientIP}:`, file.originalname)
  res.json({
    message: 'Archivo subido exitosamente.',
    filename: file.originalname
  })
}

export const calculateSpeed = (bytesUploaded, startTime) => {
  const elapsedTime = (Date.now() - startTime) / 1000 // tiempo en segundos
  return bytesUploaded / elapsedTime // bytes por segundo
}
// Middleware para manejar el progreso de la subida
export const uploadProgressMiddleware = (io) => {
  return (req, _res, next) => {
    let startTime = Date.now()
    let lastLogTime = startTime
    let bytesUploaded = 0
    const fileSize = parseInt(req.headers['content-length'], 10)
    const clientIP = req.ip.replace('::ffff:', '')
    const socketId = req.headers['x-socket-id']

    // Obtener el socket ID del cliente desde la solicitud
    if (!socketId) {
      console.warn('No se proporcionó un socket ID en la solicitud.')
      return next()
    }

    // Identificador unico para esta subida
    const uploadId = `${clientIP}-${Date.now()}`

    // Inicializar la subida en el mapa
    activeUploads.set(uploadId, {
      id: uploadId,
      clientIP,
      progress: 0,
      speed: '0 B/s',
      uploaded: '0 B',
      total: formatFileSize(fileSize),
      status: 'in-progress'
    })

    req.on('data', (chunk) => {
      bytesUploaded += chunk.length
      const now = Date.now()

      // Emitir progreso cada segundo
      if (now - lastLogTime >= 1000) {
        const progress = (bytesUploaded / fileSize) * 100
        const speed = calculateSpeed(bytesUploaded, startTime)

        // Actualizar la subida en el mapa
        activeUploads.set(uploadId, {
          ...activeUploads.get(uploadId),
          progress: progress.toFixed(2),
          speed: formatFileSize(speed) + '/s',
          uploaded: formatFileSize(bytesUploaded)
        })

        // Sobrescribir la línea anterior en la consola
        process.stdout.write(
          `\rProgreso: ${progress.toFixed(2)}% | Velocidad: ${formatFileSize(
            speed
          )}/s | Transferido: ${formatFileSize(bytesUploaded)} de ${formatFileSize(fileSize)}`
        )

        // Emitir evento de progreso solo al cliente específico
        io.to(socketId).emit('uploadProgress', {
          progress: progress.toFixed(2),
          speed: formatFileSize(speed) + '/s',
          uploaded: formatFileSize(bytesUploaded),
          total: formatFileSize(fileSize)
        })

        // Emitir lista de subidas activas a todos los clientes
        allWindows.forEach((w) => {
          w.webContents.send('active-uploads', Array.from(activeUploads.values()))
        })

        lastLogTime = now
      }
    })

    req.on('end', () => {
      console.log('\nCarga completada.')

      // Marcar subida como completada
      activeUploads.set(uploadId, {
        ...activeUploads.get(uploadId),
        progress: '100',
        status: 'completed'
      })

      // Emitir actualización global a todas las ventanas
      allWindows.forEach((w) => {
        w.webContents.send('active-uploads', Array.from(activeUploads.values()))
      })
    })

    next()
  }
}
