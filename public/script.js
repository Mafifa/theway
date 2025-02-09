const socket = io()
const uploadForm = document.getElementById('uploadForm')
const fileInput = document.getElementById('fileInput')
const dropZone = document.getElementById('drop-zone')
const fileList = document.getElementById('file-list')
const uploadsContainer = document.getElementById('uploads-container')
const notification = document.getElementById('notification')
const themeToggle = document.getElementById('theme-toggle')

let files = []
let uploads = new Map()

// Funciones de utilidad
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const showNotification = (message, type) => {
  notification.textContent = message
  notification.className = type
  notification.style.opacity = 1
  setTimeout(() => {
    notification.style.opacity = 0
  }, 3000)
}

const updateFileList = () => {
  fileList.innerHTML = ''
  files.forEach((file, index) => {
    const fileItem = document.createElement('div')
    fileItem.className = 'file-item'
    fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button class="remove-file" data-index="${index}">Eliminar</button>
        `
    fileList.appendChild(fileItem)
  })
}

const createUploadItem = (file) => {
  const uploadItem = document.createElement('div')
  uploadItem.className = 'upload-item'
  uploadItem.innerHTML = `
        <div class="upload-item-header">
            <span class="upload-item-name">${file.name}</span>
            <span class="upload-item-size">${formatFileSize(file.size)}</span>
        </div>
        <div class="upload-item-progress">
            <div class="upload-item-progress-bar" style="width: 0%"></div>
        </div>
        <div class="upload-item-info">
            <span class="upload-item-status">Esperando...</span>
            <span class="upload-item-speed"></span>
        </div>
        <div class="upload-item-actions">
            <button class="upload-item-pause"><i class="fas fa-pause"></i> Pausar</button>
            <button class="upload-item-cancel"><i class="fas fa-times"></i> Cancelar</button>
        </div>
    `
  return uploadItem
}

// Event Listeners
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropZone.classList.add('drag-over')
})

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over')
})

dropZone.addEventListener('drop', (e) => {
  e.preventDefault()
  dropZone.classList.remove('drag-over')
  files = [...files, ...e.dataTransfer.files]
  updateFileList()
})

fileInput.addEventListener('change', () => {
  files = [...files, ...fileInput.files]
  updateFileList()
})

fileList.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-file')) {
    const index = parseInt(e.target.getAttribute('data-index'))
    files.splice(index, 1)
    updateFileList()
  }
})

// Manejar la subida de archivos
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  if (files.length === 0) {
    showNotification('Por favor, selecciona al menos un archivo.', 'error')
    return
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const uploadItem = createUploadItem(file)
    uploadsContainer.appendChild(uploadItem)

    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/upload', true)
    xhr.setRequestHeader('x-file-size', file.size)
    xhr.setRequestHeader('x-socket-id', socket.id)

    const uploadId = Date.now().toString() + i
    uploads.set(uploadId, { xhr, uploadItem, paused: false })

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100
        const progressBar = uploadItem.querySelector('.upload-item-progress-bar')
        const status = uploadItem.querySelector('.upload-item-status')
        const speed = uploadItem.querySelector('.upload-item-speed')

        progressBar.style.width = percentComplete + '%'
        status.textContent = `${Math.round(percentComplete)}%`
        speed.textContent = `${formatFileSize((event.loaded / (Date.now() - xhr.startTime)) * 1000)}/s`
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        showNotification(`${file.name} se ha subido exitosamente.`, 'success')
        uploads.delete(uploadId)
        uploadItem.remove()
      } else {
        showNotification(`Error al subir ${file.name}`, 'error')
      }
    }

    xhr.onerror = () => {
      showNotification(`Error al subir ${file.name}`, 'error')
    }

    xhr.startTime = Date.now()
    xhr.send(formData)

    // Event listeners para pausar y cancelar
    const pauseButton = uploadItem.querySelector('.upload-item-pause')
    const cancelButton = uploadItem.querySelector('.upload-item-cancel')

    pauseButton.addEventListener('click', () => {
      const upload = uploads.get(uploadId)
      if (upload.paused) {
        upload.xhr.open('POST', '/upload', true)
        upload.xhr.setRequestHeader('x-file-size', file.size)
        upload.xhr.setRequestHeader('x-socket-id', socket.id)
        upload.xhr.send(formData)
        upload.paused = false
        pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pausar'
      } else {
        upload.xhr.abort()
        upload.paused = true
        pauseButton.innerHTML = '<i class="fas fa-play"></i> Reanudar'
      }
    })

    cancelButton.addEventListener('click', () => {
      const upload = uploads.get(uploadId)
      upload.xhr.abort()
      uploads.delete(uploadId)
      uploadItem.remove()
    })
  }

  files = []
  updateFileList()
})

// Manejar desconexión
window.addEventListener('beforeunload', () => {
  uploads.forEach((upload) => {
    upload.xhr.abort()
  })
  socket.disconnect()
})

// Cambiar tema
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode')
  const icon = themeToggle.querySelector('i')
  if (document.body.classList.contains('dark-mode')) {
    icon.classList.remove('fa-moon')
    icon.classList.add('fa-sun')
  } else {
    icon.classList.remove('fa-sun')
    icon.classList.add('fa-moon')
  }
})

// WebSocket event listeners
socket.on('connect', () => {
  console.log('Conectado al servidor')
})

socket.on('disconnect', () => {
  console.log('Desconectado del servidor')
  showNotification('Se ha perdido la conexión con el servidor', 'error')
})

// Actualizar la lista de dispositivos conectados
socket.on('devices', (devices) => {
  const devicesList = document.getElementById('devicesList')
  if (devicesList) {
    devicesList.innerHTML = ''
    devices.forEach((device) => {
      const li = document.createElement('li')
      li.textContent = device
      devicesList.appendChild(li)
    })
  }
})

// Actualizar el progreso desde el servidor
socket.on('uploadProgress', (data) => {
  const upload = Array.from(uploads.values()).find(
    (u) => u.uploadItem.querySelector('.upload-item-name').textContent === data.fileName
  )
  if (upload) {
    const progressBar = upload.uploadItem.querySelector('.upload-item-progress-bar')
    const status = upload.uploadItem.querySelector('.upload-item-status')
    const speed = upload.uploadItem.querySelector('.upload-item-speed')

    progressBar.style.width = `${data.progress}%`
    status.textContent = `${data.progress}%`
    speed.textContent = data.speed
  }
})
