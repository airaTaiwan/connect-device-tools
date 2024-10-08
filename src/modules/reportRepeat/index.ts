import { consola } from 'consola'
import type { Device } from '~/types'
import { performanceUtils, readFileContent, writeFile } from '~/utils'
import type { RecordRepeatSignal } from './dtos'

export async function generateReportRepeatSignal(): Promise<void> {
  consola.start(
    '開始產生腳位重複設定的報表',
  )
  const cost = performanceUtils()

  consola.info('讀取設備資料中...')
  const devices = await readFileContent<Device[]>('airaConnect.devices')

  consola.info('處理資料中...')
  const recordMap = processDevices(devices)

  const result = formatOutput(recordMap)

  consola.info(`已處理完畢，正在寫入檔案，共花費 ${(cost() / 1000).toFixed(2)} 秒`)

  await writeOutput(result)

  consola.success('已完成！')
}

function processDevices(devices: Device[]): RecordRepeatSignal[] {
  const recordMap: RecordRepeatSignal[] = []
  const deviceMap = new Map<string, Device[]>()

  for (const device of devices) {
    const key = `${device.gatewayId}/${device.communicationEquipmentId}`
    if (!deviceMap.has(key)) {
      deviceMap.set(key, [])
    }
    deviceMap.get(key)!.push(device)
  }

  for (const [key, groupDevices] of deviceMap.entries()) {
    if (groupDevices.length > 1) {
      const [gatewayId, communicationEquipmentId] = key.split('/')
      const pinMap = new Map<string, Set<string>>()

      for (const device of groupDevices) {
        for (const signal of device.signal) {
          if (!pinMap.has(signal.pin)) {
            pinMap.set(signal.pin, new Set())
          }
          pinMap.get(signal.pin)!.add(device.name)
        }
      }

      for (const [pin, deviceNames] of pinMap.entries()) {
        if (deviceNames.size > 1) {
          recordMap.push({
            gatewayId,
            communicationEquipmentId,
            pin,
            duplicateDeviceNames: Array.from(deviceNames).join(', '),
          })
        }
      }
    }
  }

  return recordMap
}

function formatOutput(recordMap: RecordRepeatSignal[]): string {
  const header = `#\tGateway\t通訊設備\tDI\t重複機具\n`

  const lines: string[] = []

  for (const [_, record] of Object.entries(recordMap)) {
    lines.push(`${lines.length + 1}\t${record.gatewayId}\t${record.communicationEquipmentId}\t${record.pin}\t${record.duplicateDeviceNames}`)
  }

  return header + lines.join('\n')
}

async function writeOutput(resultString: string): Promise<void> {
  const date = new Date()
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  const outputFileName = `./output/${formattedDate}-report-repeat-signal.txt`

  await writeFile(outputFileName, resultString)
}
