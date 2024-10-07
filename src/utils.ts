import fs from 'node:fs/promises'
import process from 'node:process'
import consola from 'consola'
import type { PathLike } from 'node:fs'

export function performanceUtils(): () => number {
  let startedAt = performance.now()
  const cost = (): number => {
    const now = performance.now()
    const cost = now - startedAt
    startedAt = now
    return cost
  }
  return cost
}

/**
 * Wrapper to exit the process if the user presses CTRL+C.
 */
export async function prompt(message: string, options: any): Promise<any> {
  const response = await consola.prompt(message, options)
  if (response.toString() === 'Symbol(clack:cancel)') {
    exit()
  }
  return response
}

export function exit(): void {
  process.exit(0)
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

/**
 * 讀取目錄下的檔案名稱
 */
export async function readFolderNames(folderPath: PathLike = 'data'): Promise<string[]> {
  return await fs.readdir(folderPath)
}

/**
 * 讀取檔案內容
 */
export async function readFileContent<T>(filePath: PathLike = 'data'): Promise<T[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(fileContent)
  }
  catch (error) {
    consola.error(`讀取檔案 ${filePath} 時發生錯誤:`, error)
    exit()
    return []
  }
}

/**
 * 寫入檔案
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8')
}
