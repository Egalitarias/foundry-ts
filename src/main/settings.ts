import { access as fsAccess, mkdir as fsMkdir, readFile as fsReadFile, writeFile as fsWriteFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

interface StoredSettings {
  projectPath?: unknown
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

function isStoredSettings(value: unknown): value is StoredSettings {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getSettingsFilePath(userDataPath: string) {
  return join(userDataPath, 'foundry-settings.json')
}

export async function loadProjectPath(
  settingsFilePath: string,
  dependencies: SettingsDependencies = {}
) {
  const readFile = dependencies.readFile ?? fsReadFile
  const fileAccess = dependencies.access ?? fsAccess

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

  const projectPath = normalizeProjectPath(parsed.projectPath)
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

  await mkdir(dirname(settingsFilePath), { recursive: true })
  await writeFile(settingsFilePath, JSON.stringify({ projectPath }, null, 2), 'utf8')

  return projectPath
}