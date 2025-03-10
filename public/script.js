const socket = io()
const uploadForm = document.getElementById('uploadForm')
const fileInput = document.getElementById('fileInput')
const dropZone = document.getElementById('drop-zone')
const fileList = document.getElementById('file-list')
const uploadsContainer = document.getElementById('uploads-container')
const notification = document.getElementById('notification')
const themeToggle = document.getElementById('theme-toggle')

let files = []
const uploads = new Map()

// Funciones de utilidad
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
              <button class="remove-file" data-index="${index}">Delete</button>
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
              <span class="upload-item-status">Waiting...</span>
            <span class="upload-item-speed"></span>
        </div>
        <div class="upload-item-actions">
              <button class="upload-item-pause"><i class="fas fa-pause"></i> Pause</button>
              <button class="upload-item-cancel"><i class="fas fa-times"></i> Cancel</button>
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
    const index = Number.parseInt(e.target.getAttribute('data-index'))
    files.splice(index, 1)
    updateFileList()
  }
})

// Handle files upload
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  if (files.length === 0) {
    showNotification('Please select at least one file.', 'error')
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
    xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name))

    const uploadId = Date.now().toString() + i
    xhr.setRequestHeader('x-upload-id', uploadId)

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
        showNotification(`${file.name} has been uploaded successfully.`, 'success')
        uploads.delete(uploadId)
        uploadItem.remove()
      } else {
        showNotification(`Error uploading ${file.name}`, 'error')
      }
    }

    xhr.onerror = () => {
      showNotification(`Error uploading ${file.name}`, 'error')
    }

    xhr.startTime = Date.now()
    xhr.send(formData)

    // Event listeners to pause and cancel
    const pauseButton = uploadItem.querySelector('.upload-item-pause')
    const cancelButton = uploadItem.querySelector('.upload-item-cancel')

    pauseButton.addEventListener('click', () => {
      const upload = uploads.get(uploadId)
      if (upload.paused) {
        upload.xhr.open('POST', '/upload', true)
        upload.xhr.setRequestHeader('x-file-size', file.size)
        upload.xhr.setRequestHeader('x-socket-id', socket.id)
        upload.xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name))
        upload.xhr.send(formData)
        upload.paused = false
        pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pause'
      } else {
        upload.xhr.abort()
        upload.paused = true
        pauseButton.innerHTML = '<i class="fas fa-play"></i> Resume'
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
  const themeIcon = document.getElementById('theme-icon')

  if (document.body.classList.contains('dark-mode')) {
    // Sol (modo claro)
    themeIcon.innerHTML = `<path d="M12 2V6M12 18V22M6.7 6.7L8.1 8.1M15.9 6.7L17.3 8.1M6.7 15.9L8.1 17.3M15.9 15.9L17.3 17.3M2 12H6M18 12H22M12 2A10 10 0 1 0 12 22A10 10 0 1 0 12 2Z" fill="yellow" stroke="yellow" stroke-width="2"/>`
  } else {
    // Luna (modo oscuro)
    themeIcon.innerHTML =
      '<path d="M21.75 14.37a9.75 9.75 0 0 1-12.12-12.12 1 1 0 0 0-1.38-1.12 10 10 0 1 0 13.62 13.62 1 1 0 0 0-1.12-1.38z"/>'
  }
})

// WebSocket event listeners
socket.on('connect', () => {
  console.log('Connected to server')
})

socket.on('disconnect', () => {
  console.log('Disconnected from server')
  showNotification('Connection to the server has been lost', 'error')
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
  const uploadItem = document.querySelector(`[data-upload-id="${data.uploadId}"]`)
  if (uploadItem) {
    const progressBar = uploadItem.querySelector('.upload-item-progress-bar')
    const status = uploadItem.querySelector('.upload-item-status')
    const speed = uploadItem.querySelector('.upload-item-speed')

    progressBar.style.width = `${data.progress}%`
    status.textContent = `${data.progress}%`
    speed.textContent = data.speed
  }
})
