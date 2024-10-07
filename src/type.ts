export interface Payload {
  _id: string
  source: {
    host: string
    port: number
    gatewayId: string
    communicationEquipmentId: string
    channel: string
  }
  data: {
    Time: string
    DI0: number
    DI1: number
    DI2: number
    DI3: number
    DI4: number
    DI5: number
    DI6: number
    DI7: number
    DI8: number
    DI9: number
    DI10: number
    DI11: number
    DI12: number
    DI13: number
    DI14: number
    DI15: number
  }
  timestamp: number
}

export interface ProcessedResult {
  signals: ProcessedSignal[]
  startTime: number
  endTime: number
}

export interface ProcessedSignal {
  gatewayId: string
  communicationEquipmentId: string
  channel: string
  diResults: string[]
  lastUpdateTime: number
}

export interface ConnectMap {
  _id: string
  areasMap: {
    [key: string]: {
      name: string
    }
  }
}

export interface Device {
  _id: string
  areaId: string
  communicationEquipmentId: string
  gatewayId: string
  model: string
  name: string
  signal: Signal[]
}

export interface Signal {
  pin: string
  state: string
  light: Lights
  note: string
  uuid: string
}

export enum Lights {
  R = 'R', // 停機
  G = 'G', // 運作
  O = 'O', // 異常
  B = 'B', // 查無指定燈號
}
