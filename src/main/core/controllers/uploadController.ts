import { formatFileSize } from '../utils/utils'

export const handleFileUpload = (req, res, io, connectedDevices) => {
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

    // Obtener el socket ID del cliente desde la solicitud
    const socketId = req.headers['x-socket-id']
    if (!socketId) {
      console.warn('No se proporcionó un socket ID en la solicitud.')
      return next()
    }

    req.on('data', (chunk) => {
      bytesUploaded += chunk.length
      const now = Date.now()

      // Emitir progreso cada segundo
      if (now - lastLogTime >= 1000) {
        const progress = (bytesUploaded / fileSize) * 100
        const speed = calculateSpeed(bytesUploaded, startTime)

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

        lastLogTime = now
      }
    })

    req.on('end', () => {
      console.log('\nCarga completada.')
    })

    next()
  }
}
