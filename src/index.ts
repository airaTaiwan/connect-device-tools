import cac from 'cac'
import { generateReportLastTimeWork } from '~/modules/reportLastTimeWork'
import { generateReportNotWorking } from '~/modules/reportNotWorking'
import { generateReportRepeatSignal } from '~/modules/reportRepeat'
import { Command } from '~/types'
import { exit } from './utils'

const cli = cac('report')

cli.command(Command.NOT_WORKING, 'generate report not working').action(generateReportNotWorking)
cli.command(Command.LAST_TIME_WORK, 'generate report last time work').action(generateReportLastTimeWork)
cli.command(Command.REPEAT_SIGNAL, 'generate report repeat signal').action(generateReportRepeatSignal)

cli
  .command('', 'Show help')
  .action(() => {
    cli.outputHelp()
    exit()
  })

cli.help()
cli.parse()
