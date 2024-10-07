import fs from 'node:fs/promises'
import process from 'node:process'
import { consola } from 'consola'
import dotenv from 'dotenv'
import { exit, performanceUtils, prompt } from './utils'
import type { Payload } from './type'

dotenv.config()

async function main(): Promise<void> {
  consola.start('開始分析資料')
  const cost = performanceUtils()

  consola.info('檢查檔案是否存在')

  const jsonFilePrefix = process.env.JSON_FILE_NAME_PREFIX
  if (!jsonFilePrefix) {
    consola.error('請設定 JSON_FILE_NAME_PREFIX 環境變數')
    exit()
  }

  const files = await readFiles()
  const filterFiles = files.filter(file => file.startsWith(jsonFilePrefix!) && file.endsWith('.json'))
  if (filterFiles.length === 0) {
    consola.error('檔案不存在')
    exit()
  }

  const selectedFiles = await prompt('請選擇分析的檔案（可多選）：', {
    type: 'multiselect',
    options: filterFiles,
  })

  let payload: Payload[] = []

  for (const selectFile of selectedFiles) {
    const filePath = new URL(`../data/${selectFile}`, import.meta.url)
    const fileContent = JSON.parse(await fs.readFile(filePath, 'utf-8')) as Payload[]
    payload = payload.concat(fileContent)
  }
  consola.info(`共有 ${payload.length} 筆資料，共花費 ${(cost() / 1000).toFixed(2)} 秒`)

  const diResults = processSignals(payload)

  const resultString = Object.entries(diResults)
    .map(([channel, diKeys]) => `${channel}: ${diKeys.join(', ')}`)
    .join('\n')

  consola.info(`已處理完畢，正在寫入檔案，共花費 ${(cost() / 1000).toFixed(2)} 秒`)

  await writeOutput(resultString)

  consola.success('已寫入檔案，共花費')
}

/**
 * 讀取檔案
 */
async function readFiles(): Promise<string[]> {
  const files = await fs
    .readdir(new URL('../data', import.meta.url))

  return files
}

/**
 * 處理來自 `gateway` 和 `communication device` 的訊號
 */
function processSignals(payload: Payload[]): Record<string, string[]> {
  const channels = [...new Set(payload.map(item => item.source.channel))]

  const groupedPayload = channels.reduce((acc, channel) => {
    acc[channel] = payload.filter(item => item.source.channel === channel)
    return acc
  }, {} as Record<string, Payload[]>)

  const diResults: Record<string, string[]> = {}

  for (const [channel, items] of Object.entries(groupedPayload)) {
    diResults[channel] = []
    for (let i = 0; i <= 16; i++) {
      const diKey = `DI${i}` as keyof Payload['data']
      if (items.every(item => item.data[diKey] === 0)) {
        diResults[channel].push(diKey)
      }
    }
  }

  return diResults
}

/**
 * 寫入結果到檔案
 */
async function writeOutput(resultString: string): Promise<void> {
  const date = new Date()
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  const formattedTime = `${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`
  const outputFileName = `../output/${formattedDate}_${formattedTime}.txt`

  await fs.writeFile(new URL(outputFileName, import.meta.url), resultString, 'utf-8')
}

main()
