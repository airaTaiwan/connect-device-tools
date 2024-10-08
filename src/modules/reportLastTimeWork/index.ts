import fs from 'node:fs/promises'
import process from 'node:process'
import consola from 'consola'
import { preprocessData, type SerializableData } from '~/modules/reportNotWorking/prepare'
import type { Device } from '~/types'
import type { Payload } from '~/types/module'
import { exit, formatDate, formatDateRange, performanceUtils, prompt, readFileContent, readFolderNames, writeFile } from '~/utils'
import type { ProcessedResult } from './dtos'

export async function generateReportLastTimeWork(): Promise<void> {
  consola.start('開始產生機具最後運作時間報表')
  const cost = performanceUtils()

  consola.info('檢查檔案中...')

  const nameMessagePrefix = process.env.Name_Message || 'airaConnect.machineryMessages.test'

  const files = await readFolderNames()

  const filterMessageFiles = files
    .filter(file => file.startsWith(nameMessagePrefix!) && file.endsWith('.json'))
    .map(file => file.replace('.json', ''))
  if (filterMessageFiles.length === 0) {
    consola.error('解析檔案不存在')
    exit()
  }

  const selectedFiles = await prompt('請選擇分析的檔案（可多選）：', {
    type: 'multiselect',
    options: filterMessageFiles,
  })

  let payload: Payload[] = []

  consola.info('讀取檔案中')
  for (const selectFile of selectedFiles) {
    const fileContent = await readFileContent<Payload>(selectFile)
    payload = payload.concat(fileContent)
  }
  consola.info(`共有 ${payload.length} 筆資料，共花費 ${(cost() / 1000).toFixed(2)} 秒`)

  let preprocessedData: SerializableData
  try {
    await fs.access('./data/preprocessed_data.json')
  }
  catch {
    consola.info('預處理數據不存在，將重新生成')

    preprocessData()
  }
  finally {
    preprocessedData = await readFileContent<SerializableData>('preprocessed_data')
  }

  const { recordMap, startTime, endTime } = processPayload(payload)
  payload.length = 0

  const { areaMap, devicesMap } = preprocessedData

  const result = formatOutput(areaMap, devicesMap, recordMap, startTime, endTime)

  consola.info(`已處理完畢，正在寫入檔案，共花費 ${(cost() / 1000).toFixed(2)} 秒`)

  await writeOutput(result)

  consola.success('已完成！')
}

function processPayload(payload: Payload[]): ProcessedResult {
  const recordMap: ProcessedResult['recordMap'] = new Map()
  let startTime = Infinity
  let endTime = -Infinity

  for (const item of payload) {
    const { source: { channel, gatewayId, communicationEquipmentId }, data, timestamp } = item

    for (let i = 0; i <= 15; i++) {
      const diKey = `DI${i}` as keyof typeof data
      if (data[diKey] === 1) {
        const key = `${gatewayId}/${communicationEquipmentId}/${diKey}`
        if (!recordMap.has(key) || timestamp > recordMap.get(key)!.lastUpdateTime) {
          recordMap.set(key, { lastUpdateTime: timestamp, channel })
        }
      }
    }

    if (timestamp < startTime) {
      startTime = timestamp
    }
    if (timestamp > endTime) {
      endTime = timestamp
    }
  }

  return { recordMap, startTime, endTime }
}

function formatOutput(
  areaMap: Record<string, string>,
  devicesMap: Record<string, Device>,
  recordMap: ProcessedResult['recordMap'],
  startTime: number,
  endTime: number,
): string {
  const dateRange = formatDateRange(startTime, endTime)
  const header = `\t${dateRange}\n#\tGateway\t通訊設備\tDI\t區域\t名稱\t燈號\t最後更新時間\n`

  const lines: string[] = []

  for (const [_key, { name, areaId, gatewayId, communicationEquipmentId, signal }] of Object.entries(devicesMap)) {
    const areaName = areaMap[areaId] || '--'

    signal.forEach(({ pin, light }) => {
      const di = pin.replace('R', 'DI')
      const key = `${gatewayId}/${communicationEquipmentId}/${di}`
      const matchingSignal = recordMap.get(key)

      if (!matchingSignal)
        return

      const lastUpdateTime = formatDate(matchingSignal.lastUpdateTime)
      const [gateway, communicationEquipment] = matchingSignal.channel.split('/')

      lines.push(`${lines.length + 1}\t${gateway}\t${communicationEquipment}\t${di}\t${areaName}\t${name}\t${light}\t${lastUpdateTime}`)
    })
  }

  return header + lines.join('\n')
}

async function writeOutput(resultString: string): Promise<void> {
  const date = new Date()
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  const outputFileName = `./output/${formattedDate}-report-last-time-work.txt`

  await writeFile(outputFileName, resultString)
}
