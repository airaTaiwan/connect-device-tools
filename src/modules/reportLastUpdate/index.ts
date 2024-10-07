import process from 'node:process'
import { consola } from 'consola'
import type { Device } from '~/type'
import { formatDate, performanceUtils, readFileContent, writeFile } from '~/utils'

export async function generateReportLastUpdate(): Promise<void> {
  consola.start('開始產生機具最後更新報表')
  const cost = performanceUtils()

  consola.info('讀取檔案中')
  const nameDevicePrefix = process.env.Name_Device || 'airaConnect.devices'
  const devices: Device[] = await readFileContent(nameDevicePrefix)

  consola.info(`讀取檔案完成，共花費 ${(cost() / 1000).toFixed(2)} 秒`)

  const result = formatOutput(devices)

  consola.info(`已處理完畢，正在寫入檔案，共花費 ${(cost() / 1000).toFixed(2)} 秒`)

  await writeOutput(result)

  consola.success('已完成！')
}

/**
 * 格式化輸出資料
 */
export function formatOutput(devices: Device[]): string {
  const startDate = new Date(Math.min(...devices.map(d => d.updatedAt)))
  const endDate = new Date(Math.max(...devices.map(d => d.updatedAt)))
  const dateRange = `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`

  const header = `\t${dateRange}\n#\t名稱\t最後更新時間\n`

  const deviceLines = devices.map((device, idx) => `${idx + 1}\t${device.name}\t${formatDate(device.updatedAt)}`).join('\n')

  return header + deviceLines
}

/**
 * 寫入結果到檔案
 */
async function writeOutput(resultString: string): Promise<void> {
  const date = new Date()
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  const outputFileName = `./output/${formattedDate}-report-last-update.txt`

  await writeFile(outputFileName, resultString)
}
