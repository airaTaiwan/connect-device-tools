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
  updatedAt: number
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
