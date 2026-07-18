import { contextBridge, ipcRenderer } from 'electron'
import type { DashboardSnapshot } from '../shared/domain'

const foundryApi = {
  getDashboardSnapshot: () => ipcRenderer.invoke('dashboard:getSnapshot') as Promise<DashboardSnapshot>,
  listOllamaModels: (url: string) => ipcRenderer.invoke('ollama:listModels', url) as Promise<string[]>,
  getProjectPath: () => ipcRenderer.invoke('settings:getProjectPath') as Promise<string | null>,
  getOllamaUrl: () => ipcRenderer.invoke('settings:getOllamaUrl') as Promise<string | null>,
  getScoutModel: () => ipcRenderer.invoke('settings:getScoutModel') as Promise<string | null>,
  getIssueModel: () => ipcRenderer.invoke('settings:getIssueModel') as Promise<string | null>,
  getEstimateModel: () => ipcRenderer.invoke('settings:getEstimateModel') as Promise<string | null>,
  getBuildModel: () => ipcRenderer.invoke('settings:getBuildModel') as Promise<string | null>,
  setOllamaUrl: (url: string | null) => ipcRenderer.invoke('settings:setOllamaUrl', url) as Promise<string | null>,
  setScoutModel: (model: string | null) => ipcRenderer.invoke('settings:setScoutModel', model) as Promise<string | null>,
  setIssueModel: (model: string | null) => ipcRenderer.invoke('settings:setIssueModel', model) as Promise<string | null>,
  setEstimateModel: (model: string | null) => ipcRenderer.invoke('settings:setEstimateModel', model) as Promise<string | null>,
  setBuildModel: (model: string | null) => ipcRenderer.invoke('settings:setBuildModel', model) as Promise<string | null>,
  selectProjectPath: () => ipcRenderer.invoke('settings:selectProjectPath') as Promise<string | null>
}

contextBridge.exposeInMainWorld('foundry', foundryApi)
