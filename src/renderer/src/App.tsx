import { useEffect, useRef, useState } from 'react'
import type { DashboardSnapshot, PhaseSummary } from '../../shared/domain'

export function phaseTone(status: PhaseSummary['status']) {
  switch (status) {
    case 'complete':
      return 'phase complete'
    case 'active':
      return 'phase active'
    case 'blocked':
      return 'phase blocked'
    default:
      return 'phase ready'
  }
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

function App() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'dashboard' | 'settings'>('dashboard')
  const [projectPath, setProjectPath] = useState('')
  const [projectPathLoading, setProjectPathLoading] = useState(false)
  const [projectPathError, setProjectPathError] = useState<string | null>(null)
  const [ollamaUrl, setOllamaUrlValue] = useState('http://127.0.0.1:11434')
  const [ollamaUrlError, setOllamaUrlError] = useState<string | null>(null)
  const [models, setModels] = useState<string[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [scoutModel, setScoutModel] = useState('')
  const [scoutModelSaving, setScoutModelSaving] = useState(false)
  const [scoutModelError, setScoutModelError] = useState<string | null>(null)
  const [issueModel, setIssueModel] = useState('')
  const [issueModelSaving, setIssueModelSaving] = useState(false)
  const [issueModelError, setIssueModelError] = useState<string | null>(null)
  const [buildModel, setBuildModel] = useState('')
  const [buildModelSaving, setBuildModelSaving] = useState(false)
  const [buildModelError, setBuildModelError] = useState<string | null>(null)
  const ollamaUrlTouchedRef = useRef(false)
  const scoutModelTouchedRef = useRef(false)
  const issueModelTouchedRef = useRef(false)
  const buildModelTouchedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    window.foundry
      .getDashboardSnapshot()
      .then((value) => {
        if (mounted) {
          setSnapshot(value)
        }
      })
      .catch((cause) => {
        if (mounted) {
          setError(cause instanceof Error ? cause.message : 'Unable to load dashboard state.')
        }
      })

    window.foundry
      .getProjectPath()
      .then((value) => {
        if (mounted && value) {
          setProjectPath((currentValue) => (currentValue.length === 0 ? value : currentValue))
        }
      })
      .catch((cause) => {
        if (mounted) {
          setProjectPathError(cause instanceof Error ? cause.message : 'Unable to read saved project path.')
        }
      })

    window.foundry
      .getOllamaUrl()
      .then((value) => {
        if (mounted && value) {
          setOllamaUrlValue((currentValue) =>
            !ollamaUrlTouchedRef.current ? value : currentValue
          )
        }
      })
      .catch((cause) => {
        if (mounted) {
          setOllamaUrlError(cause instanceof Error ? cause.message : 'Unable to load saved Ollama URL.')
        }
      })

    window.foundry
      .getScoutModel()
      .then((value) => {
        if (mounted && value) {
          setScoutModel((currentValue) =>
            !scoutModelTouchedRef.current && currentValue.length === 0 ? value : currentValue
          )
        }
      })
      .catch((cause) => {
        if (mounted) {
          setScoutModelError(cause instanceof Error ? cause.message : 'Unable to load saved Scout model.')
        }
      })

    window.foundry
      .getBuildModel()
      .then((value) => {
        if (mounted && value) {
          setBuildModel((currentValue) =>
            !buildModelTouchedRef.current && currentValue.length === 0 ? value : currentValue
          )
        }
      })
      .catch((cause) => {
        if (mounted) {
          setBuildModelError(cause instanceof Error ? cause.message : 'Unable to load saved Build model.')
        }
      })

    window.foundry
      .getIssueModel()
      .then((value) => {
        if (mounted && value) {
          setIssueModel((currentValue) =>
            !issueModelTouchedRef.current && currentValue.length === 0 ? value : currentValue
          )
        }
      })
      .catch((cause) => {
        if (mounted) {
          setIssueModelError(cause instanceof Error ? cause.message : 'Unable to load saved Issue model.')
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  if (error) {
    return (
      <main className="shell error-shell">
        <h1>Foundry could not load</h1>
        <p>{error}</p>
      </main>
    )
  }

  if (!snapshot) {
    return (
      <main className="shell loading-shell">
        <div className="loading-card">
          <span className="loading-kicker">Foundry</span>
          <h1>Loading the SDLC command center</h1>
          <p>Wiring dashboard state, agent runs, and workspace context.</p>
        </div>
      </main>
    )
  }

  const persistOllamaUrl = async (url: string) => {
    try {
      const persistedUrl = await window.foundry.setOllamaUrl(url.length > 0 ? url : null)
      if (persistedUrl) {
        setOllamaUrlValue(persistedUrl)
      }
      setOllamaUrlError(null)
      return true
    } catch (cause) {
      setOllamaUrlError(cause instanceof Error ? cause.message : 'Unable to save Ollama URL.')
      return false
    }
  }

  const loadOllamaModels = async () => {
    setModelsLoading(true)
    setModelsError(null)
    setOllamaUrlError(null)

    await persistOllamaUrl(ollamaUrl)

    try {
      const response = await window.foundry.listOllamaModels(ollamaUrl)
      setModels(response)
    } catch (cause) {
      setModelsError(cause instanceof Error ? cause.message : 'Unable to load models from Ollama.')
      setModels([])
    } finally {
      setModelsLoading(false)
    }
  }

  const selectProjectPath = async () => {
    setProjectPathLoading(true)
    setProjectPathError(null)

    try {
      const selectedPath = await window.foundry.selectProjectPath()
      if (selectedPath) {
        setProjectPath(selectedPath)
      }
    } catch (cause) {
      setProjectPathError(cause instanceof Error ? cause.message : 'Unable to select project path.')
    } finally {
      setProjectPathLoading(false)
    }
  }

  const saveScoutModel = async (model: string) => {
    const previousScoutModel = scoutModel
    setScoutModel(model)
    setScoutModelSaving(true)
    setScoutModelError(null)

    try {
      const persistedModel = await window.foundry.setScoutModel(model.length > 0 ? model : null)
      setScoutModel(persistedModel ?? '')
    } catch (cause) {
      setScoutModel(previousScoutModel)
      setScoutModelError(cause instanceof Error ? cause.message : 'Unable to save Scout model.')
    } finally {
      setScoutModelSaving(false)
    }
  }

  const saveBuildModel = async (model: string) => {
    const previousBuildModel = buildModel
    setBuildModel(model)
    setBuildModelSaving(true)
    setBuildModelError(null)

    try {
      const persistedModel = await window.foundry.setBuildModel(model.length > 0 ? model : null)
      setBuildModel(persistedModel ?? '')
    } catch (cause) {
      setBuildModel(previousBuildModel)
      setBuildModelError(cause instanceof Error ? cause.message : 'Unable to save Build model.')
    } finally {
      setBuildModelSaving(false)
    }
  }

  const saveIssueModel = async (model: string) => {
    const previousIssueModel = issueModel
    setIssueModel(model)
    setIssueModelSaving(true)
    setIssueModelError(null)

    try {
      const persistedModel = await window.foundry.setIssueModel(model.length > 0 ? model : null)
      setIssueModel(persistedModel ?? '')
    } catch (cause) {
      setIssueModel(previousIssueModel)
      setIssueModelError(cause instanceof Error ? cause.message : 'Unable to save Issue model.')
    } finally {
      setIssueModelSaving(false)
    }
  }

  const scoutModelOptions = scoutModel.length > 0 && !models.includes(scoutModel) ? [scoutModel, ...models] : models
  const issueModelOptions = issueModel.length > 0 && !models.includes(issueModel) ? [issueModel, ...models] : models
  const buildModelOptions = buildModel.length > 0 && !models.includes(buildModel) ? [buildModel, ...models] : models

  return (
    <main className="shell">
      <header className="app-header">
        <button
          type="button"
          className="settings-button"
          onClick={() => setView(view === 'dashboard' ? 'settings' : 'dashboard')}
          aria-label={view === 'dashboard' ? 'Open settings' : 'Back to dashboard'}
        >
          <svg viewBox="0 0 24 24" className="settings-icon" aria-hidden="true">
            <path d="M19.14 12.94a7.3 7.3 0 0 0 .05-.94 7.3 7.3 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.4 7.4 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.53-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.62-.05.94s.02.63.05.94L2.82 14.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.04.71 1.62.94l.36 2.54a.5.5 0 0 0 .49.42h3.84a.5.5 0 0 0 .49-.42l.36-2.54c.58-.23 1.12-.54 1.62-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
          </svg>
          <span>{view === 'dashboard' ? 'Settings' : 'Back to dashboard'}</span>
        </button>
      </header>

      {view === 'settings' ? (
        <section className="settings-view panel">
          <div className="settings-section">
            <div className="panel-header">
              <h2>Workspace settings</h2>
              <span>Project context</span>
            </div>
            <p className="settings-help">Choose the local project folder this workspace should operate on.</p>
            <label className="settings-label" htmlFor="project-path-input">
              Project path
            </label>
            <div className="settings-form-row">
              <input
                id="project-path-input"
                className="settings-input"
                value={projectPath}
                readOnly
                placeholder="No project folder selected"
              />
              <button
                type="button"
                className="settings-fetch"
                onClick={selectProjectPath}
                disabled={projectPathLoading}
              >
                {projectPathLoading ? 'Selecting...' : 'Select folder'}
              </button>
            </div>

            {projectPathError ? <p className="settings-error">{projectPathError}</p> : null}
          </div>

          <div className="settings-section">
            <div className="panel-header">
              <h2>Ollama settings</h2>
              <span>Connection profile</span>
            </div>
            <p className="settings-help">
              Enter your Ollama server URL, then fetch available models from /api/tags.
            </p>
            <label className="settings-label" htmlFor="ollama-url-input">
              Ollama server URL
            </label>
            <div className="settings-form-row">
              <input
                id="ollama-url-input"
                className="settings-input"
                value={ollamaUrl}
                onChange={(event) => {
                  ollamaUrlTouchedRef.current = true
                  setOllamaUrlValue(event.target.value)
                }}
                onBlur={() => {
                  void persistOllamaUrl(ollamaUrl)
                }}
                placeholder="http://127.0.0.1:11434"
              />
              <button type="button" className="settings-fetch" onClick={loadOllamaModels} disabled={modelsLoading}>
                {modelsLoading ? 'Loading...' : 'Load models'}
              </button>
            </div>

            {ollamaUrlError ? <p className="settings-error">{ollamaUrlError}</p> : null}
            {modelsError ? <p className="settings-error">{modelsError}</p> : null}

            <div className="models-list-wrap">
              <h3>Available models</h3>
              {models.length === 0 ? (
                <p className="settings-help">No models loaded yet.</p>
              ) : (
                <ul className="models-list">
                  {models.map((model) => (
                    <li key={model}>{model}</li>
                  ))}
                </ul>
              )}
            </div>

            <label className="settings-label" htmlFor="scout-model-select">
              Scout model
            </label>
            <select
              id="scout-model-select"
              className="settings-input"
              value={scoutModel}
              onChange={(event) => {
                scoutModelTouchedRef.current = true
                void saveScoutModel(event.target.value)
              }}
              disabled={modelsLoading || scoutModelSaving || scoutModelOptions.length === 0}
            >
              <option value="">No model selected</option>
              {scoutModelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <p className="settings-help">Pick which Ollama model Scout should use.</p>
            {scoutModelError ? <p className="settings-error">{scoutModelError}</p> : null}

            <label className="settings-label" htmlFor="issue-model-select">
              Issue model
            </label>
            <select
              id="issue-model-select"
              className="settings-input"
              value={issueModel}
              onChange={(event) => {
                issueModelTouchedRef.current = true
                void saveIssueModel(event.target.value)
              }}
              disabled={modelsLoading || issueModelSaving || issueModelOptions.length === 0}
            >
              <option value="">No model selected</option>
              {issueModelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <p className="settings-help">Pick which Ollama model Issue should use.</p>
            {issueModelError ? <p className="settings-error">{issueModelError}</p> : null}

            <label className="settings-label" htmlFor="build-model-select">
              Build model
            </label>
            <select
              id="build-model-select"
              className="settings-input"
              value={buildModel}
              onChange={(event) => {
                buildModelTouchedRef.current = true
                void saveBuildModel(event.target.value)
              }}
              disabled={modelsLoading || buildModelSaving || buildModelOptions.length === 0}
            >
              <option value="">No model selected</option>
              {buildModelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <p className="settings-help">Pick which Ollama model Build should use.</p>
            {buildModelError ? <p className="settings-error">{buildModelError}</p> : null}
          </div>
        </section>
      ) : (
        <>
      <section className="hero">
        <div>
          <p className="eyebrow">{snapshot.productName}</p>
          <h1>AI agents coordinating the software delivery lifecycle.</h1>
          <p className="lede">
            Track projects, phase transitions, approvals, and agent activity from a single desktop
            control room.
          </p>
        </div>
        <div className="hero-panel">
          <span className="hero-panel-label">Last synced</span>
          <strong>{formatTime(snapshot.updatedAt)}</strong>
          <p>Typed IPC, local state, and reviewable agent output remain in sync.</p>
        </div>
      </section>

      <section className="metric-grid">
        {snapshot.metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="stage-board">
        {snapshot.phases.map((phase) => (
          <article className="stage-card" key={phase.phase}>
            <div className="stage-header">
              <span>{phase.label}</span>
              <span className={phaseTone(phase.status)}>{phase.status}</span>
            </div>
            <strong>{phase.tasksOpen} open tasks</strong>
            <p>{phase.owners.join(' / ')}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel projects-panel">
          <div className="panel-header">
            <h2>Projects</h2>
            <span>{snapshot.projects.length} active</span>
          </div>
          <div className="project-list">
            {snapshot.projects.map((project) => (
              <article className="project-card" key={project.name}>
                <div className="project-card-header">
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.owner}</p>
                  </div>
                  <span>{project.phase}</span>
                </div>
                <div className="progress-track" aria-label={`${project.progress}% complete`}>
                  <span style={{ width: `${project.progress}%` }} />
                </div>
                <div className="project-footer">
                  <span>{project.progress}% complete</span>
                  <span>{project.blockers} blockers</span>
                </div>
                <p className="project-next">Next: {project.nextAction}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel agent-panel">
          <div className="panel-header">
            <h2>Agent queue</h2>
            <span>{snapshot.agentQueue.length} agents</span>
          </div>
          <div className="stack-list">
            {snapshot.agentQueue.map((agent) => (
              <article className="stack-row" key={`${agent.agent}-${agent.task}`}>
                <div>
                  <strong>{agent.agent}</strong>
                  <p>{agent.capability}</p>
                </div>
                <div>
                  <span className={`status status-${agent.status}`}>{agent.status}</span>
                  <p>{agent.task}</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel activity-panel">
          <div className="panel-header">
            <h2>Activity</h2>
            <span>Live trace</span>
          </div>
          <div className="activity-list">
            {snapshot.activity.map((item) => (
              <article className={`activity-item activity-${item.kind}`} key={`${item.kind}-${item.timestamp}`}>
                <strong>{item.kind}</strong>
                <p>{item.message}</p>
                <time>{formatTime(item.timestamp)}</time>
              </article>
            ))}
          </div>
          <div className="recent-runs">
            <h3>Recent runs</h3>
            {snapshot.recentRuns.map((run) => (
              <div className="run-row" key={`${run.agent}-${run.at}`}>
                <div>
                  <strong>{run.agent}</strong>
                  <p>{run.summary}</p>
                </div>
                <div>
                  <span className={`status status-${run.outcome}`}>{run.outcome}</span>
                  <p>{run.elapsedMinutes} min</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
        </>
      )}
    </main>
  )
}

export default App
