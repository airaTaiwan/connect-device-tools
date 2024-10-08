import type { Info } from '~/types/module'

export interface ProcessedResult extends Info {
  recordMap: Map<string, number>
}
