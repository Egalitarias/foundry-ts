import { access as fsAccess, mkdir as fsMkdir, readFile as fsReadFile, writeFile as fsWriteFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

interface StoredSettings {
  projectPath?: unknown
  scoutModel?: unknown
  buildModel?: unknown
  ollamaUrl?: unknown
}

interface SettingsDependencies {
  access?: (path: string) => Promise<void>
  mkdir?: (path: string, options: { recursive: true }) => Promise<void>
  readFile?: (path: string, encoding: 'utf8') => Promise<string>
  writeFile?: (path: string, data: string, encoding: 'utf8') => Promise<void>
}

function normalizeProjectPath(projectPath: unknown) {
  if (typeof projectPath !== 'string') {
    return null
  }

  const trimmed = projectPath.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeScoutModel(scoutModel: unknown) {
  if (typeof scoutModel !== 'string') {
    return null
  }

  const trimmed = scoutModel.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeBuildModel(buildModel: unknown) {
  if (typeof buildModel !== 'string') {
    return null
  }

  const trimmed = buildModel.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeOllamaUrl(ollamaUrl: unknown) {
  if (typeof ollamaUrl !== 'string') {
    return null
  }

  const trimmed = ollamaUrl.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isStoredSettings(value: unknown): value is StoredSettings {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readStoredSettings(
  settingsFilePath: string,
  dependencies: Pick<SettingsDependencies, 'readFile'> = {}
) {
  const readFile = dependencies.readFile ?? fsReadFile

  let parsed: unknown
  try {
    parsed = JSON.parse(await readFile(settingsFilePath, 'utf8')) as unknown
  } catch (cause) {
    if (cause instanceof Error && 'code' in cause && cause.code === 'ENOENT') {
      return null
    }

    return null
  }

  if (!isStoredSettings(parsed)) {
    return null
  }

  return parsed
}

function toPersistedSettings(
  stored: StoredSettings | null,
  projectPath: string | null | undefined,
  scoutModel: string | null | undefined,
  buildModel: string | null | undefined,
  ollamaUrl: string | null | undefined
) {
  const next: { projectPath?: string; scoutModel?: string; buildModel?: string; ollamaUrl?: string } = {}

  const resolvedProjectPath =
    projectPath === undefined ? normalizeProjectPath(stored?.projectPath) : projectPath
  if (resolvedProjectPath) {
    next.projectPath = resolvedProjectPath
  }

  const resolvedScoutModel =
    scoutModel === undefined ? normalizeScoutModel(stored?.scoutModel) : scoutModel
  if (resolvedScoutModel) {
    next.scoutModel = resolvedScoutModel
  }

  const resolvedBuildModel =
    buildModel === undefined ? normalizeBuildModel(stored?.buildModel) : buildModel
  if (resolvedBuildModel) {
    next.buildModel = resolvedBuildModel
  }

  const resolvedOllamaUrl = ollamaUrl === undefined ? normalizeOllamaUrl(stored?.ollamaUrl) : ollamaUrl
  if (resolvedOllamaUrl) {
    next.ollamaUrl = resolvedOllamaUrl
  }

  return next
}

export function getSettingsFilePath(userDataPath: string) {
  return join(userDataPath, 'foundry-settings.json')
}

export async function loadProjectPath(
  settingsFilePath: string,
  dependencies: SettingsDependencies = {}
) {
  const fileAccess = dependencies.access ?? fsAccess

  const stored = await readStoredSettings(settingsFilePath, dependencies)
  if (!stored) {
    return null
  }

  const projectPath = normalizeProjectPath(stored.projectPath)
  if (!projectPath) {
    return null
  }

  try {
    await fileAccess(`${projectPath}/.`)
    return projectPath
  } catch {
    return null
  }
}

export async function loadScoutModel(
  settingsFilePath: string,
  dependencies: SettingsDependencies = {}
) {
  const stored = await readStoredSettings(settingsFilePath, dependencies)
  if (!stored) {
    return null
  }

  return normalizeScoutModel(stored.scoutModel)
}

export async function loadBuildModel(
  settingsFilePath: string,
  dependencies: SettingsDependencies = {}
) {
  const stored = await readStoredSettings(settingsFilePath, dependencies)
  if (!stored) {
    return null
  }

  return normalizeBuildModel(stored.buildModel)
}

export async function loadOllamaUrl(
  settingsFilePath: string,
  dependencies: SettingsDependencies = {}
) {
  const stored = await readStoredSettings(settingsFilePath, dependencies)
  if (!stored) {
    return null
  }

  return normalizeOllamaUrl(stored.ollamaUrl)
}

export async function saveProjectPath(
  settingsFilePath: string,
  projectPathInput: string,
  dependencies: SettingsDependencies = {}
) {
  const projectPath = normalizeProjectPath(projectPathInput)
  if (!projectPath) {
    throw new Error('Project path is required.')
  }

  const mkdir = dependencies.mkdir ?? fsMkdir
  const writeFile = dependencies.writeFile ?? fsWriteFile
  const stored = await readStoredSettings(settingsFilePath, dependencies)
  const next = toPersistedSettings(stored, projectPath, undefined, undefined, undefined)

  await mkdir(dirname(settingsFilePath), { recursive: true })
  await writeFile(settingsFilePath, JSON.stringify(next, null, 2), 'utf8')

  return projectPath
}

export async function saveScoutModel(
  settingsFilePath: string,
  scoutModelInput: string | null,
  dependencies: SettingsDependencies = {}
) {
  if (scoutModelInput !== null && typeof scoutModelInput !== 'string') {
    throw new Error('Scout model is invalid.')
  }

  const scoutModel = normalizeScoutModel(scoutModelInput)
  const mkdir = dependencies.mkdir ?? fsMkdir
  const writeFile = dependencies.writeFile ?? fsWriteFile
  const stored = await readStoredSettings(settingsFilePath, dependencies)
  const next = toPersistedSettings(stored, undefined, scoutModel, undefined, undefined)

  await mkdir(dirname(settingsFilePath), { recursive: true })
  await writeFile(settingsFilePath, JSON.stringify(next, null, 2), 'utf8')

  return scoutModel
}

export async function saveBuildModel(
  settingsFilePath: string,
  buildModelInput: string | null,
  dependencies: SettingsDependencies = {}
) {
  if (buildModelInput !== null && typeof buildModelInput !== 'string') {
    throw new Error('Build model is invalid.')
  }

  const buildModel = normalizeBuildModel(buildModelInput)
  const mkdir = dependencies.mkdir ?? fsMkdir
  const writeFile = dependencies.writeFile ?? fsWriteFile
  const stored = await readStoredSettings(settingsFilePath, dependencies)
  const next = toPersistedSettings(stored, undefined, undefined, buildModel, undefined)

  await mkdir(dirname(settingsFilePath), { recursive: true })
  await writeFile(settingsFilePath, JSON.stringify(next, null, 2), 'utf8')

  return buildModel
}

export async function saveOllamaUrl(
  settingsFilePath: string,
  ollamaUrlInput: string | null,
  dependencies: SettingsDependencies = {}
) {
  if (ollamaUrlInput !== null && typeof ollamaUrlInput !== 'string') {
    throw new Error('Ollama URL is invalid.')
  }

  const ollamaUrl = normalizeOllamaUrl(ollamaUrlInput)
  const mkdir = dependencies.mkdir ?? fsMkdir
  const writeFile = dependencies.writeFile ?? fsWriteFile
  const stored = await readStoredSettings(settingsFilePath, dependencies)
  const next = toPersistedSettings(stored, undefined, undefined, undefined, ollamaUrl)

  await mkdir(dirname(settingsFilePath), { recursive: true })
  await writeFile(settingsFilePath, JSON.stringify(next, null, 2), 'utf8')

  return ollamaUrl
}