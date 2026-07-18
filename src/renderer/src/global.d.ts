import type { DashboardSnapshot } from '../../shared/domain'

declare global {
  interface Window {
    foundry: {
      getDashboardSnapshot: () => Promise<DashboardSnapshot>
      listOllamaModels: (url: string) => Promise<string[]>
    }
  }
}

export {}
