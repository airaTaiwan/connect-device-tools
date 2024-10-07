import { execSync as exec } from 'node:child_process'
import fs from 'node:fs/promises'
import process from 'node:process'
import { consola } from 'consola'
import dotenv from 'dotenv'
import { exit, formatDate, performanceUtils, prompt, readFileContent, readFolderNames } from './utils'
import type { serializableData } from './preprocess'
import type { Device, Payload, ProcessedResult, ProcessedSignal } from './type'

dotenv.config()

async function main(): Promise<void> {
  consola.start('開始分析資料')
  const cost = performanceUtils()

  consola.info('檢查檔案中')

  const nameMapPrefix = process.env.Name_Map || 'airaConnect.maps'
  const nameDevicePrefix = process.env.Name_Device || 'airaConnect.devices'
  const nameMessagePrefix = process.env.Name_Message || 'airaConnect.machineryMessages.test'

  const files = await readFolderNames()

  const isMapFileExist = files.some(file => file.startsWith(nameMapPrefix))
  if (!isMapFileExist) {
    consola.error('地圖檔案不存在')
    exit()
  }

  const isDeviceFileExist = files.some(file => file.startsWith(nameDevicePrefix))
  if (!isDeviceFileExist) {
    consola.error('機具檔案不存在')
    exit()
  }

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

  let preprocessedData: serializableData
  try {
    await fs.access('preprocessed_data.json')
  }
  catch {
    consola.info('預處理數據不存在，將重新生成')

    exec('nr preprocess', { stdio: 'inherit' })
  }
  finally {
    const data = await fs.readFile('preprocessed_data.json', 'utf-8')
    preprocessedData = JSON.parse(data)
  }

  const { signals: transformedPayloads, startTime, endTime } = processPayload(payload)
  payload.length = 0

  const { areaMap, devicesMap } = preprocessedData

  const resultString = formatOutput(areaMap, devicesMap, transformedPayloads, startTime, endTime)

  consola.info(`已處理完畢，正在寫入檔案，共花費 ${(cost() / 1000).toFixed(2)} 秒`)

  await writeOutput(resultString)

  consola.success('已寫入檔案，共花費')
}

function processPayload(payload: Payload[]): ProcessedResult {
  let startTime = Infinity
  let endTime = -Infinity

  const groupedPayload = payload.reduce((acc, item) => {
    const key = `${item.source.gatewayId}/${item.source.communicationEquipmentId}`

    if (!acc.has(key)) {
      const allDias = new Set<string>()
      for (let i = 0; i <= 15; i++) {
        allDias.add(`DI${i}`)
      }

      acc.set(key, {
        gatewayId: item.source.gatewayId,
        communicationEquipmentId: item.source.communicationEquipmentId,
        channel: item.source.channel,
        diResults: allDias,
        lastUpdateTime: item.timestamp,
      })
    }

    const entry = acc.get(key)!

    for (let i = 0; i <= 15; i++) {
      const diKey = `DI${i}`

      if (item.data[diKey as keyof typeof item.data] === 1) {
        entry.diResults.delete(diKey)
      }
    }

    // 更新時間範圍
    entry.lastUpdateTime = Math.max(entry.lastUpdateTime, item.timestamp)
    startTime = Math.min(startTime, item.timestamp)
    endTime = Math.max(endTime, item.timestamp)

    return acc
  }, new Map<string, Omit<ProcessedSignal, 'diResults'> & { diResults: Set<string> }>())

  // 過濾並轉換結果
  const signals = Array.from(groupedPayload.values())
    .map(({ diResults, ...rest }) => ({
      ...rest,
      diResults: Array.from(diResults),
    }))
    .filter(signal => signal.diResults.length > 0)

  return { signals, startTime, endTime }
}

/**
 * 格式化輸出資料
 */
function formatOutput(
  areaMap: Record<string, string>,
  devicesMap: Record<string, Device>,
  processedSignals: ProcessedSignal[],
  startTime: number,
  endTime: number,
): string {
  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  const formattedDate = `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`

  const header = `日期\t${formattedDate}\nGateway\t通訊設備\tDI\t區域\t名稱\t燈號\t最後更新時間\n`
  const lines: string[] = []

  processedSignals.forEach((signal) => {
    const [gateway, communicationEquipment] = signal.channel.split('/')
    const deviceKey = `${signal.gatewayId}/${signal.communicationEquipmentId}`

    const matchingDevices = Object.entries(devicesMap)
      .filter(([key]) => {
        return key.startsWith(deviceKey)
      })
      .map(([_, device]) => device)

    matchingDevices.forEach((device) => {
      const areaName = areaMap[device.areaId] || '--'
      const formattedLastUpdateTime = formatDate(signal.lastUpdateTime)

      signal.diResults.forEach((diKey) => {
        const diNumber = diKey.replace('DI', '')
        const matchingSignal = device.signal.find(s => s.pin.replace('R', '') === diNumber)

        if (matchingSignal) {
          lines.push(`${gateway}\t${communicationEquipment}\t${diKey}\t${areaName}\t${device.name}\t${matchingSignal.light}\t${formattedLastUpdateTime}`)
        }
      })
    })
  })

  return header + lines.join('\n')
}

/**
 * 寫入結果到檔案
 */
async function writeOutput(resultString: string): Promise<void> {
  const date = new Date()
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  const outputFileName = `../output/${formattedDate}.txt`

  await fs.writeFile(new URL(outputFileName, import.meta.url), resultString, 'utf-8')
}

main()
