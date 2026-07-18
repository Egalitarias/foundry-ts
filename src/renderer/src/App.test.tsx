/* @vitest-environment jsdom */

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { formatTime, phaseTone } from './App'
import type { DashboardSnapshot } from '../../shared/domain'

declare global {
  interface Window {
    foundry: {
      getDashboardSnapshot: () => Promise<DashboardSnapshot>
      listOllamaModels: (url: string) => Promise<string[]>
      getProjectPath: () => Promise<string | null>
      getOllamaUrl: () => Promise<string | null>
      getScoutModel: () => Promise<string | null>
      getIssueModel: () => Promise<string | null>
      getBuildModel: () => Promise<string | null>
      setOllamaUrl: (url: string | null) => Promise<string | null>
      setScoutModel: (model: string | null) => Promise<string | null>
      setIssueModel: (model: string | null) => Promise<string | null>
      setBuildModel: (model: string | null) => Promise<string | null>
      selectProjectPath: () => Promise<string | null>
    }
  }
}

const baseSnapshot: DashboardSnapshot = {
  productName: 'Foundry',
  updatedAt: '2026-07-18T12:00:00.000Z',
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
      at: '2026-07-18T11:35:00.000Z'
    },
    {
      agent: 'Scout',
      summary: 'Mapped the local workspace and confirmed the app skeleton',
      outcome: 'complete',
      elapsedMinutes: 8,
      at: '2026-07-18T11:05:00.000Z'
    }
  ],
  activity: [
    {
      kind: 'approval',
      message: 'Approved the initial architecture and issue plan.',
      timestamp: '2026-07-18T11:45:00.000Z'
    },
    {
      kind: 'run',
      message: 'Builder finished the first dashboard pass and handed off for review.',
      timestamp: '2026-07-18T11:32:00.000Z'
    },
    {
      kind: 'alert',
      message: 'Review lane is blocked until the integration checks are green.',
      timestamp: '2026-07-18T11:19:00.000Z'
    }
  ]
}

function withSnapshot(overrides: Partial<DashboardSnapshot> = {}): DashboardSnapshot {
  return {
    ...baseSnapshot,
    ...overrides
  }
}

describe('App helpers', () => {
  it('maps phase statuses to expected css classes', () => {
    expect(phaseTone('complete')).toBe('phase complete')
    expect(phaseTone('active')).toBe('phase active')
    expect(phaseTone('blocked')).toBe('phase blocked')
    expect(phaseTone('ready')).toBe('phase ready')
  })

  it('formats timestamps into user-friendly text', () => {
    expect(formatTime('2026-07-18T12:00:00.000Z')).toMatch(/[A-Za-z]{3}/)
  })
})

describe('App rendering', () => {
  beforeEach(() => {
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue('/Users/garydavies/github/egalitarias/foundry-ts'),
      getOllamaUrl: vi.fn().mockResolvedValue('http://127.0.0.1:11434'),
      getScoutModel: vi.fn().mockResolvedValue('llama3:latest'),
      getIssueModel: vi.fn().mockResolvedValue('qwen2.5:latest'),
      getBuildModel: vi.fn().mockResolvedValue('qwen2.5:latest'),
      setOllamaUrl: vi.fn().mockImplementation((url: string | null) => Promise.resolve(url)),
      setScoutModel: vi.fn().mockImplementation((model: string | null) => Promise.resolve(model)),
      setIssueModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockImplementation((model: string | null) => Promise.resolve(model)),
      selectProjectPath: vi.fn().mockResolvedValue('/Users/garydavies/github/egalitarias/foundry-ts')
    }
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows loading state before snapshot resolves', () => {
    window.foundry = {
      getDashboardSnapshot: () => new Promise<DashboardSnapshot>(() => {}),
      listOllamaModels: vi.fn().mockResolvedValue([]),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    expect(screen.getByText('Loading the SDLC command center')).toBeInTheDocument()
  })

  it('renders the dashboard title after loading', async () => {
    render(<App />)
    expect(await screen.findByText('AI agents coordinating the software delivery lifecycle.')).toBeInTheDocument()
  })

  it('renders metric cards from snapshot data', async () => {
    render(<App />)
    await screen.findByText('Active projects')
    expect(screen.getByText('Open agent runs')).toBeInTheDocument()
    expect(screen.getByText('Blocked tasks')).toBeInTheDocument()
    expect(screen.getByText('Approved changes')).toBeInTheDocument()
  })

  it('renders all SDLC phases', async () => {
    render(<App />)
    await screen.findByText('Discover')
    expect(screen.getByText('Plan')).toBeInTheDocument()
    expect(screen.getByText('Build')).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
    expect(screen.getByText('Ship')).toBeInTheDocument()
  })

  it('renders projects and next actions', async () => {
    render(<App />)
    await screen.findByText('Foundry Core')
    expect(screen.getByText('Agent Telemetry')).toBeInTheDocument()
    expect(screen.getByText('Release Orchestration')).toBeInTheDocument()
    expect(screen.getByText(/Next: Review the typed IPC bridge/)).toBeInTheDocument()
  })

  it('renders the agent queue and statuses', async () => {
    render(<App />)
    await screen.findByText('Agent queue')
    expect(screen.getAllByText('Scout').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Builder').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Verifier').length).toBeGreaterThan(0)
    expect(screen.getAllByText('queued').length).toBeGreaterThan(0)
  })

  it('renders activity items and recent runs', async () => {
    render(<App />)
    await screen.findByText('Activity')
    expect(screen.getByText('Live trace')).toBeInTheDocument()
    expect(screen.getByText('Recent runs')).toBeInTheDocument()
    expect(screen.getByText('Generated the shell for the SDLC dashboard and phase cards')).toBeInTheDocument()
  })

  it('renders error state when snapshot load fails', async () => {
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockRejectedValue(new Error('IPC unavailable')),
      listOllamaModels: vi.fn().mockResolvedValue([]),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Foundry could not load')).toBeInTheDocument()
    })
    expect(screen.getByText('IPC unavailable')).toBeInTheDocument()
  })

  it('falls back to generic error message for non-error rejection', async () => {
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockRejectedValue('bad'),
      listOllamaModels: vi.fn().mockResolvedValue([]),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load dashboard state.')).toBeInTheDocument()
    })
  })

  it('uses the sync panel metadata from snapshot', async () => {
    render(<App />)
    await screen.findByText('Last synced')
    expect(screen.getByText('Typed IPC, local state, and reviewable agent output remain in sync.')).toBeInTheDocument()
  })

  it('loads models from settings when the fetch button is pressed', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    await user.click(screen.getByRole('button', { name: 'Load models' }))

    await waitFor(() => {
      const modelsList = document.querySelector('.models-list')
      expect(modelsList).not.toBeNull()
      expect(within(modelsList as HTMLElement).getByText('llama3:latest')).toBeInTheDocument()
      expect(within(modelsList as HTMLElement).getByText('qwen2.5:latest')).toBeInTheDocument()
    })
  })

  it('loads and displays saved Scout model in settings', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    expect(await screen.findByDisplayValue('llama3:latest')).toBeInTheDocument()
  })

  it('loads and displays saved Build model in settings', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    const buildSelect = screen.getByLabelText('Build model')
    expect(buildSelect).toHaveDisplayValue('qwen2.5:latest')
  })

  it('loads and displays saved Issue model in settings', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    const issueSelect = screen.getByLabelText('Issue model')
    expect(issueSelect).toHaveDisplayValue('qwen2.5:latest')
  })

  it('renders Issue model between Scout and Build selectors', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    const scoutSelect = screen.getByLabelText('Scout model')
    const issueSelect = screen.getByLabelText('Issue model')
    const buildSelect = screen.getByLabelText('Build model')

    expect(scoutSelect.compareDocumentPosition(issueSelect) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(issueSelect.compareDocumentPosition(buildSelect) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('loads and displays saved Ollama URL in settings', async () => {
    const user = userEvent.setup()
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue('http://localhost:11434'),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    expect(await screen.findByDisplayValue('http://localhost:11434')).toBeInTheDocument()
  })

  it('saves Scout model selection from settings', async () => {
    const user = userEvent.setup()
    const setScoutModel = vi.fn().mockResolvedValue('qwen2.5:latest')
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue('llama3:latest'),
      getIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel,
      setIssueModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    await user.click(screen.getByRole('button', { name: 'Load models' }))
    await user.selectOptions(screen.getByLabelText('Scout model'), 'qwen2.5:latest')

    expect(setScoutModel).toHaveBeenCalledWith('qwen2.5:latest')
    expect(await screen.findByDisplayValue('qwen2.5:latest')).toBeInTheDocument()
  })

  it('saves Build model selection from settings', async () => {
    const user = userEvent.setup()
    const setBuildModel = vi.fn().mockResolvedValue('llama3:latest')
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue('qwen2.5:latest'),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      setBuildModel,
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    await user.click(screen.getByRole('button', { name: 'Load models' }))
    await user.selectOptions(screen.getByLabelText('Build model'), 'llama3:latest')

    expect(setBuildModel).toHaveBeenCalledWith('llama3:latest')
    expect(await screen.findByDisplayValue('llama3:latest')).toBeInTheDocument()
  })

  it('saves Issue model selection from settings', async () => {
    const user = userEvent.setup()
    const setIssueModel = vi.fn().mockResolvedValue('llama3:latest')
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue('qwen2.5:latest'),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel,
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    await user.click(screen.getByRole('button', { name: 'Load models' }))
    await user.selectOptions(screen.getByLabelText('Issue model'), 'llama3:latest')

    expect(setIssueModel).toHaveBeenCalledWith('llama3:latest')
    expect(screen.getByLabelText('Issue model')).toHaveDisplayValue('llama3:latest')
  })

  it('selects and displays a project path from settings', async () => {
    const user = userEvent.setup()
    const selectProjectPath = vi.fn().mockResolvedValue('/Users/garydavies/github/egalitarias/foundry-ts')
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    await user.click(screen.getByRole('button', { name: 'Select folder' }))

    expect(await screen.findByDisplayValue('/Users/garydavies/github/egalitarias/foundry-ts')).toBeInTheDocument()
    expect(selectProjectPath).toHaveBeenCalledTimes(1)
  })

  it('loads and displays the saved project path when settings open', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    expect(await screen.findByDisplayValue('/Users/garydavies/github/egalitarias/foundry-ts')).toBeInTheDocument()
  })

  it('shows a project path selection error for non-error rejections', async () => {
    const user = userEvent.setup()
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockRejectedValue('denied')
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    await user.click(screen.getByRole('button', { name: 'Select folder' }))

    expect(await screen.findByText('Unable to select project path.')).toBeInTheDocument()
  })

  it('shows error and clears models when loading models fails with Error', async () => {
    const user = userEvent.setup()
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi
        .fn()
        .mockResolvedValueOnce(['llama3:latest'])
        .mockRejectedValueOnce(new Error('Server unreachable')),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    await user.click(screen.getByRole('button', { name: 'Load models' }))
    expect((await screen.findAllByText('llama3:latest')).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Load models' }))
    await screen.findByText('Server unreachable')
    expect(screen.queryByText('llama3:latest')).not.toBeInTheDocument()
  })

  it('shows fallback error for non-Error model load failure and clears models', async () => {
    const user = userEvent.setup()
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi
        .fn()
        .mockResolvedValueOnce(['llama3:latest'])
        .mockRejectedValueOnce('bad response'),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    await user.click(screen.getByRole('button', { name: 'Load models' }))
    expect((await screen.findAllByText('llama3:latest')).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Load models' }))
    await screen.findByText('Unable to load models from Ollama.')
    expect(screen.queryByText('llama3:latest')).not.toBeInTheDocument()
  })

  it('shows a project path load error when saved settings cannot be read', async () => {
    const user = userEvent.setup()
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockRejectedValue(new Error('Unable to read saved project path.')),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))

    expect(await screen.findByText('Unable to read saved project path.')).toBeInTheDocument()
  })

  it('shows Scout model save error when persistence fails', async () => {
    const user = userEvent.setup()
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue('llama3:latest'),
      getIssueModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockRejectedValue(new Error('Unable to save Scout model.')),
      setIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    await user.click(screen.getByRole('button', { name: 'Load models' }))
    await user.selectOptions(screen.getByLabelText('Scout model'), 'qwen2.5:latest')

    expect(await screen.findByText('Unable to save Scout model.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('llama3:latest')).toBeInTheDocument()
  })

  it('shows Build model save error when persistence fails', async () => {
    const user = userEvent.setup()
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue('qwen2.5:latest'),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockRejectedValue(new Error('Unable to save Build model.')),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    await user.click(screen.getByRole('button', { name: 'Load models' }))
    await user.selectOptions(screen.getByLabelText('Build model'), 'llama3:latest')

    expect(await screen.findByText('Unable to save Build model.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('qwen2.5:latest')).toBeInTheDocument()
  })

  it('shows Issue model save error when persistence fails', async () => {
    const user = userEvent.setup()
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue('qwen2.5:latest'),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockResolvedValue(null),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockRejectedValue(new Error('Unable to save Issue model.')),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    await user.click(screen.getByRole('button', { name: 'Load models' }))
    await user.selectOptions(screen.getByLabelText('Issue model'), 'llama3:latest')

    expect(await screen.findByText('Unable to save Issue model.')).toBeInTheDocument()
    expect(screen.getByLabelText('Issue model')).toHaveDisplayValue('qwen2.5:latest')
  })

  it('saves Ollama URL when input loses focus', async () => {
    const user = userEvent.setup()
    const setOllamaUrl = vi.fn().mockResolvedValue('http://localhost:11434')
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl,
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    const ollamaUrlInput = await screen.findByLabelText('Ollama server URL')
    await user.clear(ollamaUrlInput)
    await user.type(ollamaUrlInput, 'http://localhost:11434')
    await user.tab()

    await waitFor(() => {
      expect(setOllamaUrl).toHaveBeenCalledWith('http://localhost:11434')
    })
  })

  it('shows Ollama URL save error when persistence fails', async () => {
    const user = userEvent.setup()
    window.foundry = {
      getDashboardSnapshot: vi.fn().mockResolvedValue(withSnapshot()),
      listOllamaModels: vi.fn().mockResolvedValue(['llama3:latest', 'qwen2.5:latest']),
      getProjectPath: vi.fn().mockResolvedValue(null),
      getOllamaUrl: vi.fn().mockResolvedValue(null),
      getScoutModel: vi.fn().mockResolvedValue(null),
      getIssueModel: vi.fn().mockResolvedValue(null),
      getBuildModel: vi.fn().mockResolvedValue(null),
      setOllamaUrl: vi.fn().mockRejectedValue(new Error('Unable to save Ollama URL.')),
      setScoutModel: vi.fn().mockResolvedValue(null),
      setIssueModel: vi.fn().mockResolvedValue(null),
      setBuildModel: vi.fn().mockResolvedValue(null),
      selectProjectPath: vi.fn().mockResolvedValue(null)
    }

    render(<App />)

    await screen.findByText('AI agents coordinating the software delivery lifecycle.')
    await user.click(screen.getByRole('button', { name: 'Open settings' }))
    const ollamaUrlInput = await screen.findByLabelText('Ollama server URL')
    await user.clear(ollamaUrlInput)
    await user.type(ollamaUrlInput, 'http://localhost:11434')
    await user.tab()

    expect(await screen.findByText('Unable to save Ollama URL.')).toBeInTheDocument()
  })
})
