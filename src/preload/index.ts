import { contextBridge, ipcRenderer } from 'electron'
import type { DashboardSnapshot } from '../shared/domain'

const foundryApi = {
  getDashboardSnapshot: () => ipcRenderer.invoke('dashboard:getSnapshot') as Promise<DashboardSnapshot>,
  listOllamaModels: (url: string) => ipcRenderer.invoke('ollama:listModels', url) as Promise<string[]>,
  getProjectPath: () => ipcRenderer.invoke('settings:getProjectPath') as Promise<string | null>,
  selectProjectPath: () => ipcRenderer.invoke('settings:selectProjectPath') as Promise<string | null>
}

contextBridge.exposeInMainWorld('foundry', foundryApi)
