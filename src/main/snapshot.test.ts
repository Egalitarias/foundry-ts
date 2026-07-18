import { describe, expect, it } from 'vitest'
import { createSeedSnapshot } from './snapshot'

const FIXED_NOW = Date.UTC(2026, 6, 18, 12, 0, 0)

describe('createSeedSnapshot', () => {
  it('returns the expected product identity', () => {
    const snapshot = createSeedSnapshot(FIXED_NOW)
    expect(snapshot.productName).toBe('Foundry')
  })

  it('includes four top-level metrics', () => {
    const snapshot = createSeedSnapshot(FIXED_NOW)
    expect(snapshot.metrics).toHaveLength(4)
  })

  it('includes all six SDLC phases', () => {
    const snapshot = createSeedSnapshot(FIXED_NOW)
    expect(snapshot.phases.map((item) => item.phase)).toEqual([
      'discover',
      'plan',
      'build',
      'test',
      'review',
      'ship'
    ])
  })

  it('assigns non-empty owners for every phase', () => {
    const snapshot = createSeedSnapshot(FIXED_NOW)
    snapshot.phases.forEach((phase) => {
      expect(phase.owners.length).toBeGreaterThan(0)
    })
  })

  it('keeps project progress between 0 and 100', () => {
    const snapshot = createSeedSnapshot(FIXED_NOW)
    snapshot.projects.forEach((project) => {
      expect(project.progress).toBeGreaterThanOrEqual(0)
      expect(project.progress).toBeLessThanOrEqual(100)
    })
  })

  it('keeps queue item statuses inside the run status domain', () => {
    const snapshot = createSeedSnapshot(FIXED_NOW)
    const statuses = snapshot.agentQueue.map((item) => item.status)
    expect(statuses).toEqual(['running', 'needs-review', 'queued'])
  })

  it('orders recent runs newest to oldest', () => {
    const snapshot = createSeedSnapshot(FIXED_NOW)
    const times = snapshot.recentRuns.map((run) => Date.parse(run.at))
    expect(times[0]).toBeGreaterThan(times[1])
  })

  it('orders activity entries newest to oldest', () => {
    const snapshot = createSeedSnapshot(FIXED_NOW)
    const times = snapshot.activity.map((item) => Date.parse(item.timestamp))
    expect(times[0]).toBeGreaterThan(times[1])
    expect(times[1]).toBeGreaterThan(times[2])
  })
})
