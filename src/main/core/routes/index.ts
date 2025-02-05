import express from 'express'
import { handleFileUpload } from '../controllers/uploadController'
import { uploadProgressMiddleware } from '../controllers/uploadController'

const router = (upload, io, connectedDevices) => {
  const apiRouter = express.Router()

  // Endpoint para subir archivos
  apiRouter.post(
    '/upload',
    uploadProgressMiddleware(io), // Middleware para manejar el progreso
    upload.single('file'),
    (req, res) => {
      handleFileUpload(req, res, io, connectedDevices)
    }
  )

  return apiRouter
}

export default router
