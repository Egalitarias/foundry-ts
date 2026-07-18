import type { OllamaModelList } from '../shared/domain'

const OLLAMA_REQUEST_TIMEOUT_MS = 5000

export function normalizeOllamaBaseUrl(urlInput: unknown): URL {
  if (typeof urlInput !== 'string') {
    throw new Error('Ollama URL is invalid.')
  }

  const raw = urlInput.trim()
  if (!raw) {
    throw new Error('Ollama URL is required.')
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('Ollama URL is invalid.')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are supported.')
  }

  parsed.search = ''
  parsed.hash = ''

  if (parsed.pathname !== '/') {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '')
  }

  return parsed
}

function createTagsEndpoint(baseUrl: URL) {
  const endpoint = new URL(baseUrl.toString())
  const pathPrefix = baseUrl.pathname === '/' ? '' : baseUrl.pathname
  endpoint.pathname = `${pathPrefix}/api/tags`
  return endpoint.toString()
}

export async function listOllamaModels(urlInput: unknown, fetchImpl: typeof fetch = fetch) {
  const baseUrl = normalizeOllamaBaseUrl(urlInput)
  const endpoint = createTagsEndpoint(baseUrl)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetchImpl(endpoint, {
      method: 'GET',
      signal: controller.signal
    })
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') {
      throw new Error('Timed out while contacting Ollama server.')
    }

    throw new Error('Unable to reach Ollama server.')
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    throw new Error(`Unable to reach Ollama server (${response.status}).`)
  }

  let payload: Partial<OllamaModelList>
  try {
    payload = (await response.json()) as Partial<OllamaModelList>
  } catch {
    throw new Error('Invalid model response from Ollama server.')
  }

  if (!payload.models || !Array.isArray(payload.models)) {
    throw new Error('Invalid model response from Ollama server.')
  }

  return payload.models
    .map((model) => model.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
}