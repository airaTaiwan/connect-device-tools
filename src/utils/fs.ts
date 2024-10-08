import fs from 'node:fs/promises'
import type { PathLike } from 'node:fs'

/**
 * 讀取目錄下的檔案名稱
 */
export async function readFolderNames(folderPath: PathLike = './data'): Promise<string[]> {
  return await fs.readdir(folderPath)
}

/**
 * 讀取檔案內容
 */
export async function readFileContent<T>(fileName: string): Promise<T> {
  const fileContent = await fs.readFile(`./data/${fileName}.json`, 'utf-8')
  return JSON.parse(fileContent)
}

/**
 * 寫入檔案
 */
export async function writeFile(name: string, content: string): Promise<void> {
  await fs.writeFile(`./output/${name}.txt`, content, 'utf-8')
}

/**
 * 檢查檔案是否存在
 */
export async function checkFileExists(fileName: string): Promise<boolean> {
  try {
    await fs.access(fileName)
    return true
  }
  catch {
    return false
  }
}
