import { describe, expect, it, vi } from 'vitest'
import { loadProjectPath, saveProjectPath } from './settings'

describe('loadProjectPath', () => {
  it('returns null when the settings file is missing', async () => {
    const readFile = vi.fn().mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }))

    await expect(loadProjectPath('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns null when the settings JSON is malformed', async () => {
    const readFile = vi.fn().mockResolvedValue('{not json')

    await expect(loadProjectPath('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns null when the saved project path is missing', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({}))

    await expect(loadProjectPath('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns null when the saved project path is not accessible', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ projectPath: '/missing/project' }))
    const access = vi.fn().mockRejectedValue(new Error('ENOENT'))

    await expect(loadProjectPath('/tmp/foundry-settings.json', { readFile, access })).resolves.toBeNull()
  })

  it('returns the saved project path when it exists', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ projectPath: '/Users/garydavies/project' }))
    const access = vi.fn().mockResolvedValue(undefined)

    await expect(loadProjectPath('/tmp/foundry-settings.json', { readFile, access })).resolves.toBe(
      '/Users/garydavies/project'
    )
  })
})

describe('saveProjectPath', () => {
  it('creates the parent directory and writes the trimmed project path', async () => {
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await saveProjectPath('/tmp/foundry/settings.json', '  /Users/garydavies/project  ', {
      mkdir,
      writeFile
    })

    expect(mkdir).toHaveBeenCalledWith('/tmp/foundry', { recursive: true })
    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ projectPath: '/Users/garydavies/project' }, null, 2),
      'utf8'
    )
  })

  it('rejects empty project paths', async () => {
    await expect(saveProjectPath('/tmp/foundry/settings.json', '   ')).rejects.toThrow('Project path is required.')
  })
})