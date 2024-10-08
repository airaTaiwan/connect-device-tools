import { execSync as exec } from 'node:child_process'
import { Command } from '~/types'
import { prompt } from '~/utils'

async function cli(): Promise<void> {
  const selectReport = await prompt('請選擇要產生的報表：', {
    type: 'select',
    options: Object.values(Command),
  })

  exec(`esno src/index.ts ${selectReport}`, { stdio: 'inherit' })
}

cli()
