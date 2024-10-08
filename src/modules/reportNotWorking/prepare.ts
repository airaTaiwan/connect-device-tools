import fs from 'node:fs/promises'
import process from 'node:process'
import { consola } from 'consola'
import dotenv from 'dotenv'
import type { ConnectMap, Device } from '~/types'
import { readFileContent } from '../../utils'

export interface PreprocessedData {
  devicesMap: Map<string, Device>
  areaMap: Map<string, string>
}

export interface SerializableData {
  areaMap: Record<string, string>
  devicesMap: Record<string, Device>
}

export function preprocessAreaMap(maps: ConnectMap[]): Map<string, string> {
  const areaMap = new Map<string, string>()
  maps.forEach((map) => {
    Object.entries(map.areasMap).forEach(([areaId, { name }]) => {
      areaMap.set(areaId, name)
    })
  })

  return areaMap
}

export function preprocessDevicesMap(devices: Device[]): Map<string, Device> {
  const devicesMap = new Map(
    devices.map(d => [
      `${d.gatewayId}/${d.communicationEquipmentId}/${d.signal.map(s => s.pin).join('-')}`,
      d,
    ]),
  )
  return devicesMap
}

export async function preprocessData(): Promise<PreprocessedData> {
  dotenv.config()

  consola.start('開始預處理數據')

  const mapName = process.env.Name_Map || 'airaConnect.maps'
  const deviceName = process.env.Name_Device || 'airaConnect.devices'

  const maps: ConnectMap[] = await readFileContent(mapName)
  const devices: Device[] = await readFileContent(deviceName)

  const areaMap = preprocessAreaMap(maps)
  const devicesMap = preprocessDevicesMap(devices)

  const result: PreprocessedData = { devicesMap, areaMap }

  const serializableData: SerializableData = {
    areaMap: Object.fromEntries(areaMap),
    devicesMap: Object.fromEntries(devicesMap),
  }

  await fs.writeFile('./data/preprocessed_data.json', JSON.stringify(serializableData, null, 2))

  consola.success('預處理數據完成')

  return result
}
