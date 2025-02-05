import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'
import router from './routes'
import multerConfig from './middleware/multerConfig'
import { getLocalIP } from './utils/utils'
import os from 'os'
const app = express()

export default function startServer(pathStorage?: string) {
  const server = http.createServer(app)
  const io = new Server(server)

  const connectedDevices = new Set()

  // Configuración de la ruta de almacenamiento
  const storagePath =
    pathStorage ||
    (is.dev
      ? path.join(__dirname, '..', '..', 'uploads')
      : path.join(os.homedir(), 'Desktop', 'uploads'))

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true })
  }

  console.log('Dirección de carga actual:', storagePath)

  // Middleware para servir archivos estáticos
  app.use(express.static(path.join(__dirname, '..', '..', 'public')))

  // Ruta raíz para servir la interfaz
  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public/index.html'))
  })

  // Middleware para asociar el socket ID con la solicitud HTTP
  app.use((req, _res, next) => {
    const socketId = req.headers['x-socket-id']
    if (socketId) {
      req.socketId = socketId
    }
    next()
  })

  // Configuración de Multer
  const upload = multerConfig(storagePath)

  // Importar rutas
  app.use('/api', router(upload, io, connectedDevices))

  // WebSocket para manejar dispositivos conectados
  io.on('connection', (socket) => {
    const clientIP = socket.handshake.address.replace('::ffff:', '')
    console.log(`Dispositivo conectado: ${clientIP}`)
    connectedDevices.add(clientIP)

    io.emit('devices', Array.from(connectedDevices))

    socket.on('disconnect', () => {
      console.log(`Dispositivo desconectado: ${clientIP}`)
      connectedDevices.delete(clientIP)
      io.emit('devices', Array.from(connectedDevices))
    })
  })

  return { io, server }
}
