export type SdlcPhase = 'discover' | 'plan' | 'build' | 'test' | 'review' | 'ship'

export type RunStatus = 'queued' | 'running' | 'blocked' | 'needs-review' | 'complete'

export interface DashboardMetric {
  label: string
  value: string
  detail: string
}

export interface PhaseSummary {
  phase: SdlcPhase
  label: string
  status: 'active' | 'ready' | 'blocked' | 'complete'
  tasksOpen: number
  owners: string[]
}

export interface ProjectSummary {
  name: string
  owner: string
  phase: SdlcPhase
  progress: number
  blockers: number
  nextAction: string
}

export interface AgentQueueItem {
  agent: string
  capability: string
  task: string
  status: RunStatus
}

export interface RunRecord {
  agent: string
  summary: string
  outcome: RunStatus
  elapsedMinutes: number
  at: string
}

export interface ActivityItem {
  kind: 'approval' | 'run' | 'note' | 'alert'
  message: string
  timestamp: string
}

export interface DashboardSnapshot {
  productName: string
  updatedAt: string
  metrics: DashboardMetric[]
  phases: PhaseSummary[]
  projects: ProjectSummary[]
  agentQueue: AgentQueueItem[]
  recentRuns: RunRecord[]
  activity: ActivityItem[]
}
