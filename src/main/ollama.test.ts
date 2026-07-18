import { describe, expect, it, vi } from 'vitest'
import { listOllamaModels, normalizeOllamaBaseUrl } from './ollama'

describe('normalizeOllamaBaseUrl', () => {
  it('rejects non-string input', () => {
    expect(() => normalizeOllamaBaseUrl(undefined)).toThrow('Ollama URL is invalid.')
  })

  it('rejects empty strings', () => {
    expect(() => normalizeOllamaBaseUrl('   ')).toThrow('Ollama URL is required.')
  })

  it('rejects unsupported protocols', () => {
    expect(() => normalizeOllamaBaseUrl('ftp://localhost:11434')).toThrow(
      'Only http and https URLs are supported.'
    )
  })

  it('preserves path prefixes while stripping query and hash', () => {
    const parsed = normalizeOllamaBaseUrl('https://example.com/ollama/?token=1#x')
    expect(parsed.toString()).toBe('https://example.com/ollama')
  })
})

describe('listOllamaModels', () => {
  it('requests /api/tags from root urls', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ models: [{ name: 'llama3' }] })
    })

    const models = await listOllamaModels('http://127.0.0.1:11434', fetchImpl as unknown as typeof fetch)
    expect(models).toEqual(['llama3'])
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/api/tags',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('requests /api/tags under path-prefixed base urls', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ models: [{ name: 'qwen2.5' }] })
    })

    const models = await listOllamaModels('https://example.com/ollama', fetchImpl as unknown as typeof fetch)
    expect(models).toEqual(['qwen2.5'])
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.com/ollama/api/tags',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('returns friendly error for network failures', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(
      listOllamaModels('http://127.0.0.1:11434', fetchImpl as unknown as typeof fetch)
    ).rejects.toThrow('Unable to reach Ollama server.')
  })

  it('returns timeout error when request is aborted', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    const fetchImpl = vi.fn().mockRejectedValue(abortError)

    await expect(
      listOllamaModels('http://127.0.0.1:11434', fetchImpl as unknown as typeof fetch)
    ).rejects.toThrow('Timed out while contacting Ollama server.')
  })

  it('returns status-based error for non-ok responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503
    })

    await expect(
      listOllamaModels('http://127.0.0.1:11434', fetchImpl as unknown as typeof fetch)
    ).rejects.toThrow('Unable to reach Ollama server (503).')
  })

  it('returns validation error for malformed payloads', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ nope: true })
    })

    await expect(
      listOllamaModels('http://127.0.0.1:11434', fetchImpl as unknown as typeof fetch)
    ).rejects.toThrow('Invalid model response from Ollama server.')
  })
})