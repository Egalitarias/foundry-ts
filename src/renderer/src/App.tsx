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

  return (
    <main className="shell">
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
    </main>
  )
}

export default App
