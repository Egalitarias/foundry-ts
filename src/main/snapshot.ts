import type { DashboardSnapshot } from '../shared/domain'

const MINUTE = 60 * 1000

export function createSeedSnapshot(now: number = Date.now()): DashboardSnapshot {
  return {
    productName: 'Foundry',
    updatedAt: new Date(now).toISOString(),
    metrics: [
      { label: 'Active projects', value: '4', detail: '2 shipping this week' },
      { label: 'Open agent runs', value: '7', detail: '3 awaiting review' },
      { label: 'Blocked tasks', value: '2', detail: '1 due to repo access' },
      { label: 'Approved changes', value: '18', detail: 'Last 24 hours' }
    ],
    phases: [
      { phase: 'discover', label: 'Discover', status: 'complete', tasksOpen: 0, owners: ['Product'] },
      { phase: 'plan', label: 'Plan', status: 'active', tasksOpen: 3, owners: ['Product', 'Engineering'] },
      { phase: 'build', label: 'Build', status: 'active', tasksOpen: 5, owners: ['Engineering', 'AI agents'] },
      { phase: 'test', label: 'Test', status: 'ready', tasksOpen: 4, owners: ['QA'] },
      { phase: 'review', label: 'Review', status: 'blocked', tasksOpen: 2, owners: ['Engineering'] },
      { phase: 'ship', label: 'Ship', status: 'ready', tasksOpen: 1, owners: ['Release'] }
    ],
    projects: [
      {
        name: 'Foundry Core',
        owner: 'Platform',
        phase: 'build',
        progress: 68,
        blockers: 1,
        nextAction: 'Review the typed IPC bridge and finish the activity stream'
      },
      {
        name: 'Agent Telemetry',
        owner: 'Engineering',
        phase: 'test',
        progress: 54,
        blockers: 0,
        nextAction: 'Validate run history and response timing metrics'
      },
      {
        name: 'Release Orchestration',
        owner: 'Ops',
        phase: 'review',
        progress: 39,
        blockers: 2,
        nextAction: 'Clear approvals before packaging the desktop build'
      }
    ],
    agentQueue: [
      {
        agent: 'Scout',
        capability: 'Repo discovery',
        task: 'Collect context from the workspace and summarize open gaps',
        status: 'running'
      },
      {
        agent: 'Builder',
        capability: 'Feature implementation',
        task: 'Assemble the dashboard shell and application wiring',
        status: 'needs-review'
      },
      {
        agent: 'Verifier',
        capability: 'Testing',
        task: 'Confirm the desktop app boots and IPC responses resolve',
        status: 'queued'
      }
    ],
    recentRuns: [
      {
        agent: 'Builder',
        summary: 'Generated the shell for the SDLC dashboard and phase cards',
        outcome: 'needs-review',
        elapsedMinutes: 14,
        at: new Date(now - 25 * MINUTE).toISOString()
      },
      {
        agent: 'Scout',
        summary: 'Mapped the local workspace and confirmed the app skeleton',
        outcome: 'complete',
        elapsedMinutes: 8,
        at: new Date(now - 55 * MINUTE).toISOString()
      }
    ],
    activity: [
      {
        kind: 'approval',
        message: 'Approved the initial architecture and issue plan.',
        timestamp: new Date(now - 15 * MINUTE).toISOString()
      },
      {
        kind: 'run',
        message: 'Builder finished the first dashboard pass and handed off for review.',
        timestamp: new Date(now - 28 * MINUTE).toISOString()
      },
      {
        kind: 'alert',
        message: 'Review lane is blocked until the integration checks are green.',
        timestamp: new Date(now - 41 * MINUTE).toISOString()
      }
    ]
  }
}
