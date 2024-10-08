import fs from 'node:fs/promises'
import process from 'node:process'
import { consola } from 'consola'
import { checkFileExists, readFileContent } from './utils/fs'
import type { CommunicationEquipment, ConnectMap, Device } from './types'

export interface SerializableData {
  areaMap: Record<string, string>
  devicesMap: Record<string, Device>
  communicationEquipmentMap: Record<string, CommunicationEquipment>
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

export function preprocessCommunicationEquipmentMap(communicationEquipments: CommunicationEquipment[]): Map<string, CommunicationEquipment> {
  const communicationEquipmentMap = new Map<string, CommunicationEquipment>()
  communicationEquipments.forEach((communicationEquipment) => {
    communicationEquipmentMap.set(communicationEquipment._id, communicationEquipment)
  })
  return communicationEquipmentMap
}

export async function preprocessData(): Promise<void> {
  consola.start('檢查預處理數據是否已經存在')
  const isExist = await checkFileExists('./data/preprocessed_data.json')

  if (isExist) {
    consola.success('預處理數據已經存在')
    return
  }

  const mapName = process.env.Name_Map || 'airaConnect.maps'
  const deviceName = process.env.Name_Device || 'airaConnect.devices'
  const communicationEquipmentName = process.env.Name_CommunicationEquipment || 'airaConnect.communicationEquipments'

  const maps: ConnectMap[] = await readFileContent(mapName)
  const devices: Device[] = await readFileContent(deviceName)
  const communicationEquipments: CommunicationEquipment[] = await readFileContent(communicationEquipmentName)

  const areaMap = preprocessAreaMap(maps)
  const devicesMap = preprocessDevicesMap(devices)
  const communicationEquipmentMap = preprocessCommunicationEquipmentMap(communicationEquipments)

  const serializableData: SerializableData = {
    areaMap: Object.fromEntries(areaMap),
    devicesMap: Object.fromEntries(devicesMap),
    communicationEquipmentMap: Object.fromEntries(communicationEquipmentMap),
  }

  await fs.writeFile('./data/preprocessed_data.json', JSON.stringify(serializableData, null, 2))

  consola.success('預處理數據完成')
}

export async function cleanPreprocessedData(): Promise<void> {
  consola.start('清除預處理數據')
  await fs.rm('./data/preprocessed_data.json')
  consola.success('預處理數據清除完成')
}
