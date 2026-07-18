import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { createSeedSnapshot } from './snapshot'
import type { OllamaModelList } from '../shared/domain'

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

  ipcMain.handle('ollama:listModels', async (_, urlInput: string) => {
    const baseUrl = normalizeOllamaBaseUrl(urlInput)
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(`Unable to reach Ollama server (${response.status}).`)
    }

    const payload = (await response.json()) as Partial<OllamaModelList>
    if (!payload.models || !Array.isArray(payload.models)) {
      throw new Error('Invalid model response from Ollama server.')
    }

    return payload.models
      .map((model) => model.name)
      .filter((name): name is string => typeof name === 'string' && name.length > 0)
  })
}

function normalizeOllamaBaseUrl(urlInput: string) {
  const raw = urlInput.trim()
  if (!raw) {
    throw new Error('Ollama URL is required.')
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('Ollama URL is invalid.')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are supported.')
  }

  parsed.pathname = ''
  parsed.search = ''
  parsed.hash = ''

  return parsed.toString().replace(/\/$/, '')
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
