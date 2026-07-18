import { contextBridge, ipcRenderer } from 'electron'
import type { DashboardSnapshot } from '../shared/domain'

const foundryApi = {
  getDashboardSnapshot: () => ipcRenderer.invoke('dashboard:getSnapshot') as Promise<DashboardSnapshot>
}

contextBridge.exposeInMainWorld('foundry', foundryApi)
