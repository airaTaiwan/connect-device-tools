import cac from 'cac'
import dotenv from 'dotenv'
import { generateReportLastTimeWork } from '~/modules/reportLastTimeWork'
import { generateReportNotWorking } from '~/modules/reportNotWorking'
import { generateReportRepeatSignal } from '~/modules/reportRepeat'
import { cleanPreprocessedData, preprocessData } from '~/prepare'
import { Command } from '~/types'
import { exit } from './utils/tools'

dotenv.config({ override: true })

const cli = cac('report')

cli.command(Command.NOT_WORKING, 'generate report not working').action(() => run(generateReportNotWorking))
cli.command(Command.LAST_TIME_WORK, 'generate report last time work').action(() => run(generateReportLastTimeWork))
cli.command(Command.REPEAT_SIGNAL, 'generate report repeat signal').action(() => run(generateReportRepeatSignal))

cli.command('prepare', 'preprocess data').action(async () => {
  await cleanPreprocessedData()
  await preprocessData()
})

cli
  .command('', 'Show help')
  .action(() => {
    cli.outputHelp()
    exit()
  })

cli.help()
cli.parse()

async function run(cb: () => Promise<void>): Promise<void> {
  await preprocessData()
  await cb()
}
