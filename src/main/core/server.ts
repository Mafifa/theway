import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'
import router from './routes'
import multerConfig from './middleware/multerConfig'
import os from 'os'
import { BrowserWindow } from 'electron'
const app = express()

export default function startServer(pathStorage?: string) {
  const server = http.createServer(app)
  const io = new Server(server)

  const connectedDevices = new Set()

  // Storage path configuration
  const storagePath =
    pathStorage ||
    (is.dev
      ? path.join(__dirname, '..', '..', 'uploads')
      : path.join(os.homedir(), 'Desktop', 'uploads'))

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true })
  }

  console.log('Current upload address:', storagePath)

  // Middleware to serve static files
  app.use(express.static(path.join(__dirname, '..', '..', 'public')))

  // Root path to serve the interface
  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public/index.html'))
  })

  // Middleware to associate the socket ID with the HTTP request
  app.use((req, _res, next) => {
    const socketId = req.headers['x-socket-id']
    if (socketId) {
      req.socketId = socketId
    }
    next()
  })

  // Multer configuration
  const upload = multerConfig(storagePath)

  // Import routes
  app.use('/', router(upload, io, connectedDevices))

  // WebSocket to manage connected devices
  io.on('connection', (socket) => {
    const clientIP = socket.handshake.address.replace('::ffff:', '')
    console.log(`Connected device: ${clientIP}`)
    connectedDevices.add(clientIP)

    // Send the list of connected devices to all clients
    const allWindows = BrowserWindow.getAllWindows()

    allWindows.forEach((w) => {
      w.webContents.send('devices', Array.from(connectedDevices))
    })

    socket.on('disconnect', () => {
      console.log(`Disconnected device: ${clientIP}`)
      connectedDevices.delete(clientIP)

      allWindows.forEach((w) => {
        w.webContents.send('devices', Array.from(connectedDevices))
      })
    })
  })

  return { io, server }
}
