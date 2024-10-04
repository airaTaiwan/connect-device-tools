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
