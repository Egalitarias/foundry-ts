import type { DashboardSnapshot } from '../../shared/domain'

declare global {
  interface Window {
    foundry: {
      getDashboardSnapshot: () => Promise<DashboardSnapshot>
      listOllamaModels: (url: string) => Promise<string[]>
      getProjectPath: () => Promise<string | null>
      getScoutModel: () => Promise<string | null>
      setScoutModel: (model: string | null) => Promise<string | null>
      selectProjectPath: () => Promise<string | null>
    }
  }
}

export {}
