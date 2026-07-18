import { describe, expect, it, vi } from 'vitest'
import {
  loadBuildModel,
  loadOllamaUrl,
  loadProjectPath,
  loadScoutModel,
  saveBuildModel,
  saveOllamaUrl,
  saveProjectPath,
  saveScoutModel
} from './settings'

describe('loadProjectPath', () => {
  it('returns null when the settings file is missing', async () => {
    const readFile = vi.fn().mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }))

    await expect(loadProjectPath('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns null when the settings JSON is malformed', async () => {
    const readFile = vi.fn().mockResolvedValue('{not json')

    await expect(loadProjectPath('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns null when the settings JSON is valid but not an object', async () => {
    const readFile = vi.fn().mockResolvedValue('null')

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
    expect(access).toHaveBeenCalledWith('/Users/garydavies/project/.')
  })

  it('returns null when the saved path points to a file', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ projectPath: '/Users/garydavies/project.txt' }))
    const access = vi.fn().mockRejectedValue(new Error('ENOTDIR'))

    await expect(loadProjectPath('/tmp/foundry-settings.json', { readFile, access })).resolves.toBeNull()
    expect(access).toHaveBeenCalledWith('/Users/garydavies/project.txt/.')
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

  it('preserves saved Scout model when writing project path', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ scoutModel: 'llama3:latest' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await saveProjectPath('/tmp/foundry/settings.json', '/Users/garydavies/project', {
      readFile,
      mkdir,
      writeFile
    })

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ projectPath: '/Users/garydavies/project', scoutModel: 'llama3:latest' }, null, 2),
      'utf8'
    )
  })

  it('preserves saved Build model when writing project path', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ buildModel: 'qwen2.5:latest' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await saveProjectPath('/tmp/foundry/settings.json', '/Users/garydavies/project', {
      readFile,
      mkdir,
      writeFile
    })

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ projectPath: '/Users/garydavies/project', buildModel: 'qwen2.5:latest' }, null, 2),
      'utf8'
    )
  })

  it('preserves saved Ollama URL when writing project path', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ ollamaUrl: 'http://localhost:11434' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await saveProjectPath('/tmp/foundry/settings.json', '/Users/garydavies/project', {
      readFile,
      mkdir,
      writeFile
    })

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ projectPath: '/Users/garydavies/project', ollamaUrl: 'http://localhost:11434' }, null, 2),
      'utf8'
    )
  })
})

describe('loadScoutModel', () => {
  it('returns null when no Scout model is saved', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({}))

    await expect(loadScoutModel('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns null when saved Scout model is blank', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ scoutModel: '   ' }))

    await expect(loadScoutModel('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns saved Scout model when present', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ scoutModel: 'qwen2.5:latest' }))

    await expect(loadScoutModel('/tmp/foundry-settings.json', { readFile })).resolves.toBe('qwen2.5:latest')
  })
})

describe('saveScoutModel', () => {
  it('writes Scout model and preserves project path', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ projectPath: '/Users/garydavies/project' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await saveScoutModel('/tmp/foundry/settings.json', 'qwen2.5:latest', {
      readFile,
      mkdir,
      writeFile
    })

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ projectPath: '/Users/garydavies/project', scoutModel: 'qwen2.5:latest' }, null, 2),
      'utf8'
    )
  })

  it('writes Scout model and preserves Build model', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ buildModel: 'llama3:latest' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await saveScoutModel('/tmp/foundry/settings.json', 'qwen2.5:latest', {
      readFile,
      mkdir,
      writeFile
    })

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ scoutModel: 'qwen2.5:latest', buildModel: 'llama3:latest' }, null, 2),
      'utf8'
    )
  })

  it('clears Scout model when null is passed', async () => {
    const readFile = vi
      .fn()
      .mockResolvedValue(JSON.stringify({ projectPath: '/Users/garydavies/project', scoutModel: 'llama3:latest' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await expect(
      saveScoutModel('/tmp/foundry/settings.json', null, {
        readFile,
        mkdir,
        writeFile
      })
    ).resolves.toBeNull()

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ projectPath: '/Users/garydavies/project' }, null, 2),
      'utf8'
    )
  })
})

describe('loadBuildModel', () => {
  it('returns null when no Build model is saved', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({}))

    await expect(loadBuildModel('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns null when saved Build model is blank', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ buildModel: '   ' }))

    await expect(loadBuildModel('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns saved Build model when present', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ buildModel: 'llama3:latest' }))

    await expect(loadBuildModel('/tmp/foundry-settings.json', { readFile })).resolves.toBe('llama3:latest')
  })
})

describe('loadOllamaUrl', () => {
  it('returns null when no Ollama URL is saved', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({}))

    await expect(loadOllamaUrl('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns null when saved Ollama URL is blank', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ ollamaUrl: '   ' }))

    await expect(loadOllamaUrl('/tmp/foundry-settings.json', { readFile })).resolves.toBeNull()
  })

  it('returns saved Ollama URL when present', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ ollamaUrl: 'http://localhost:11434' }))

    await expect(loadOllamaUrl('/tmp/foundry-settings.json', { readFile })).resolves.toBe('http://localhost:11434')
  })
})

describe('saveBuildModel', () => {
  it('writes Build model and preserves project path', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ projectPath: '/Users/garydavies/project' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await saveBuildModel('/tmp/foundry/settings.json', 'llama3:latest', {
      readFile,
      mkdir,
      writeFile
    })

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ projectPath: '/Users/garydavies/project', buildModel: 'llama3:latest' }, null, 2),
      'utf8'
    )
  })

  it('writes Build model and preserves Scout model', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ scoutModel: 'qwen2.5:latest' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await saveBuildModel('/tmp/foundry/settings.json', 'llama3:latest', {
      readFile,
      mkdir,
      writeFile
    })

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ scoutModel: 'qwen2.5:latest', buildModel: 'llama3:latest' }, null, 2),
      'utf8'
    )
  })

  it('clears Build model when null is passed', async () => {
    const readFile = vi
      .fn()
      .mockResolvedValue(JSON.stringify({ projectPath: '/Users/garydavies/project', buildModel: 'llama3:latest' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await expect(
      saveBuildModel('/tmp/foundry/settings.json', null, {
        readFile,
        mkdir,
        writeFile
      })
    ).resolves.toBeNull()

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ projectPath: '/Users/garydavies/project' }, null, 2),
      'utf8'
    )
  })
})

describe('saveOllamaUrl', () => {
  it('writes Ollama URL and preserves project path', async () => {
    const readFile = vi.fn().mockResolvedValue(JSON.stringify({ projectPath: '/Users/garydavies/project' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await saveOllamaUrl('/tmp/foundry/settings.json', 'http://localhost:11434', {
      readFile,
      mkdir,
      writeFile
    })

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ projectPath: '/Users/garydavies/project', ollamaUrl: 'http://localhost:11434' }, null, 2),
      'utf8'
    )
  })

  it('writes Ollama URL and preserves Scout and Build models', async () => {
    const readFile = vi
      .fn()
      .mockResolvedValue(JSON.stringify({ scoutModel: 'qwen2.5:latest', buildModel: 'llama3:latest' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await saveOllamaUrl('/tmp/foundry/settings.json', 'http://localhost:11434', {
      readFile,
      mkdir,
      writeFile
    })

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify(
        { scoutModel: 'qwen2.5:latest', buildModel: 'llama3:latest', ollamaUrl: 'http://localhost:11434' },
        null,
        2
      ),
      'utf8'
    )
  })

  it('clears Ollama URL when null is passed', async () => {
    const readFile = vi
      .fn()
      .mockResolvedValue(JSON.stringify({ projectPath: '/Users/garydavies/project', ollamaUrl: 'http://localhost:11434' }))
    const mkdir = vi.fn().mockResolvedValue(undefined)
    const writeFile = vi.fn().mockResolvedValue(undefined)

    await expect(
      saveOllamaUrl('/tmp/foundry/settings.json', null, {
        readFile,
        mkdir,
        writeFile
      })
    ).resolves.toBeNull()

    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/foundry/settings.json',
      JSON.stringify({ projectPath: '/Users/garydavies/project' }, null, 2),
      'utf8'
    )
  })
})