import fs from 'node:fs/promises'
import process from 'node:process'
import { consola } from 'consola'
import { performanceUtils, prompt } from './utils'
import type { Payload } from './type'

async function main(): Promise<void> {
  consola.start('開始分析資料')
  const cost = performanceUtils()

  consola.info('檢查檔案是否存在')

  const files = await fs
    .readdir(new URL('../data', import.meta.url))
  const filterFiles = files.filter(file => file.startsWith('airaConnect.machineryMessages') && file.endsWith('.json'))
  if (filterFiles.length === 0) {
    consola.error('檔案不存在')
    process.exit(1)
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

  const resultString = Object.entries(diResults)
    .map(([channel, diKeys]) => `${channel}: ${diKeys.join(', ')}`)
    .join('\n')

  consola.info(`已處理完畢，正在寫入檔案，共花費 ${(cost() / 1000).toFixed(2)} 秒`)

  await fs.writeFile(new URL('../.output.txt', import.meta.url), resultString, 'utf-8')
  consola.success('已寫入檔案，共花費')
}

main()
