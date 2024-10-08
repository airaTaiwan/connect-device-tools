import type { Info } from '~/types/module'

export interface ProcessedResult extends Info {
  recordMap: Map<string, RecordLastWork>
}

export interface RecordLastWork {
  channel: string
  lastUpdateTime: number
}
