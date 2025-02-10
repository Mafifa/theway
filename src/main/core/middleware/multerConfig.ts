import multer from 'multer'
import fs from 'fs'

const multerConfig = (storagePath: string) => {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.promises
        .mkdir(storagePath, { recursive: true })
        .then(() => cb(null, storagePath))
        .catch((error) => cb(null, error))
    },
    filename: (_req, file, cb) => {
      cb(null, Buffer.from(file.originalname, 'latin1').toString('utf8'))
    }
  })

  return multer({
    storage,
    limits: { fileSize: Infinity } // Allow files of any size
  })
}

export default multerConfig
