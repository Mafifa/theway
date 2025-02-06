const socket = io()
const uploadForm = document.getElementById('uploadForm')
const fileInput = document.getElementById('fileInput')
const progressBar = document.getElementById('progress-fill')
const progressText = document.getElementById('progress-text')
const progressContainer = document.getElementById('progress-container')
const devicesList = document.getElementById('devicesList')
const dropZone = document.getElementById('drop-zone')
const fileList = document.getElementById('file-list')
const notification = document.getElementById('notification')
const speedText = document.getElementById('speed-text')
const uploadedText = document.getElementById('uploaded-text')

let files = []

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

  progressContainer.classList.remove('hidden')
  let overallProgress = 0

  for (let i = 0; i < files.length; i++) {
    const formData = new FormData()
    formData.append('file', files[i])

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        headers: {
          'x-file-size': files[i].size,
          'x-socket-id': socket.id
        },
        body: formData
      })

      if (response.ok) {
        overallProgress = ((i + 1) / files.length) * 100
        progressBar.style.width = `${overallProgress}%`
        progressText.textContent = `${Math.round(overallProgress)}%`
      } else {
        throw new Error('Error en la subida del archivo')
      }
    } catch (error) {
      console.error('Error:', error)
      showNotification(`Error al subir ${files[i].name}`, 'error')
    }
  }

  showNotification('Todos los archivos se han subido exitosamente.', 'success')
  progressContainer.classList.add('hidden')
  files = []
  updateFileList()
})

// Actualizar la lista de dispositivos conectados
socket.on('devices', (devices) => {
  devicesList.innerHTML = ''
  devices.forEach((device) => {
    const li = document.createElement('li')
    li.textContent = device
    devicesList.appendChild(li)
  })
})

// Actualizar el progreso desde el servidor
socket.on('uploadProgress', (data) => {
  progressBar.style.width = `${data.progress}%`
  progressText.textContent = `${data.progress}%`
  speedText.textContent = `Velocidad: ${data.speed}`
  uploadedText.textContent = `Transferido: ${data.uploaded} de ${data.total}`
})
