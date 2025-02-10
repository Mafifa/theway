import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import startServer from './core/server'
import { getLocalIP } from './core/utils/utils'
import { getActiveUploads } from './core/controllers/uploadController'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 670,
    minWidth: 1300,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Handle updates to active loads
  ipcMain.on('update-active-uploads', () => {
    const uploads = getActiveUploads()
    console.log('Sending active uploads to renderer:', uploads)
    mainWindow.webContents.send('active-uploads', uploads)
  })

  // Handle active upload requests
  ipcMain.handle('get-active-uploads', () => {
    console.log('Handling get-active-uploads request')
    const uploads = getActiveUploads()
    console.log('Sending active uploads to renderer:', uploads)
    return uploads
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const { server } = startServer()
  ipcMain.handle('on-off', (_, port = 3000) => {
    const localIP = getLocalIP()

    if (server.listening) {
      server.close()
      return false
    } else {
      server.listen(port, '0.0.0.0', () => {
        console.log('Server runnign on port:')
        console.log(`- Local: http://localhost:${port}`)
        console.log(`- Network:   http://${localIP}:${port}`)
      })
      return { red: `http://${localIP}:${port}` }
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
