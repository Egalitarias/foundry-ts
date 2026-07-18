import { useEffect, useState } from 'react'
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
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434')
  const [models, setModels] = useState<string[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)

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

  const loadOllamaModels = async () => {
    setModelsLoading(true)
    setModelsError(null)

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

  return (
    <main className="shell">
      <header className="app-header">
        <button
          type="button"
          className="settings-button"
          onClick={() => setView(view === 'dashboard' ? 'settings' : 'dashboard')}
          aria-label="Open settings"
        >
          <svg viewBox="0 0 24 24" className="settings-icon" aria-hidden="true">
            <path d="M19.14 12.94a7.3 7.3 0 0 0 .05-.94 7.3 7.3 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.4 7.4 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.53-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.62-.05.94s.02.63.05.94L2.82 14.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.04.71 1.62.94l.36 2.54a.5.5 0 0 0 .49.42h3.84a.5.5 0 0 0 .49-.42l.36-2.54c.58-.23 1.12-.54 1.62-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
          </svg>
          <span>{view === 'dashboard' ? 'Settings' : 'Back to dashboard'}</span>
        </button>
      </header>

      {view === 'settings' ? (
        <section className="settings-view panel">
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
              onChange={(event) => setOllamaUrl(event.target.value)}
              placeholder="http://127.0.0.1:11434"
            />
            <button type="button" className="settings-fetch" onClick={loadOllamaModels} disabled={modelsLoading}>
              {modelsLoading ? 'Loading...' : 'Load models'}
            </button>
          </div>

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
