import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import type { OpenDialogOptions } from 'electron'
import { join } from 'node:path'
import { createSeedSnapshot } from './snapshot'
import { listOllamaModels } from './ollama'
import {
  getSettingsFilePath,
  loadBuildModel,
  loadProjectPath,
  loadScoutModel,
  saveBuildModel,
  saveProjectPath,
  saveScoutModel
} from './settings'

const seedSnapshot = createSeedSnapshot()

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: '#09111f',
    titleBarStyle: 'default',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']

  if (devServerUrl) {
    window.loadURL(devServerUrl)
    window.webContents.openDevTools({ mode: 'detach' })
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc() {
  ipcMain.handle('dashboard:getSnapshot', () => seedSnapshot)

  ipcMain.handle('ollama:listModels', (_, urlInput: unknown) => listOllamaModels(urlInput))

  ipcMain.handle('settings:getProjectPath', () => loadProjectPath(getSettingsFilePath(app.getPath('userData'))))
  ipcMain.handle('settings:getScoutModel', () => loadScoutModel(getSettingsFilePath(app.getPath('userData'))))
  ipcMain.handle('settings:getBuildModel', () => loadBuildModel(getSettingsFilePath(app.getPath('userData'))))
  ipcMain.handle('settings:setScoutModel', (_, scoutModelInput: string | null) =>
    saveScoutModel(getSettingsFilePath(app.getPath('userData')), scoutModelInput)
  )
  ipcMain.handle('settings:setBuildModel', (_, buildModelInput: string | null) =>
    saveBuildModel(getSettingsFilePath(app.getPath('userData')), buildModelInput)
  )

  ipcMain.handle('settings:selectProjectPath', async () => {
    const options: OpenDialogOptions = {
      title: 'Select project folder',
      buttonLabel: 'Select folder',
      properties: ['openDirectory', 'createDirectory']
    }
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled) {
      return null
    }

    const selectedPath = result.filePaths.find((filePath) => filePath.trim().length > 0)
    if (!selectedPath) {
      return null
    }

    return saveProjectPath(getSettingsFilePath(app.getPath('userData')), selectedPath)
  })
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
