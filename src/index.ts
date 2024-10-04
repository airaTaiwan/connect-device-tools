import fs from 'node:fs/promises'
import process from 'node:process'
import { consola } from 'consola'
import { performanceUtils } from './utils'
import type { Payload } from './type'

consola.start('開始分析資料')
const cost = performanceUtils()

consola.info('檢查檔案是否存在')

try {
  await fs.access(new URL('../data/airaConnect.machineryMessages.json', import.meta.url))
}
catch {
  consola.error('檔案不存在')
  process.exit(1)
}

const payload = JSON.parse(await fs.readFile(
  new URL('../data/airaConnect.machineryMessages.json', import.meta.url),
  'utf-8',
)) as Payload[]
consola.info(`共有 ${payload.length} 筆資料，共花費 ${(cost() / 1000).toFixed(2)} 秒`)

const channels = [...new Set(payload.map(item => item.source.channel))]

const groupedPayload = channels.reduce((acc, channel) => {
  acc[channel] = payload.filter(item => item.source.channel === channel)
  return acc
}, {} as Record<string, Payload[]>)

const diResults: Record<string, string[]> = {}

for (const [channel, items] of Object.entries(groupedPayload)) {
  diResults[channel] = []
  for (let i = 0; i <= 12; i++) {
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

await fs.writeFile('/Users/cofcat/i/connect-device-tools/.output.txt', resultString, 'utf-8')
consola.success('已寫入檔案，共花費')
