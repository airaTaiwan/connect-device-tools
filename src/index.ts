import cac from 'cac'
import { generateReportLastTimeWork } from '~/modules/reportLastTimeWork'
import { generateReportLastUpdate } from '~/modules/reportLastUpdate'
import { generateReportNotWorking } from '~/modules/reportNotWorking'
import { exit } from './utils'

const cli = cac()

cli
  .command('report', 'generate report')
  .option('--type <type>', 'Set report type', {
    default: 'last-time-work',
  })
  .action((options) => {
    if (options.type === 'not-working') {
      generateReportNotWorking()
    }
    if (options.type === 'last-update') {
      generateReportLastUpdate()
    }
    if (options.type === 'last-time-work') {
      generateReportLastTimeWork()
    }
  })

cli
  .command('', 'Show help')
  .action(() => {
    cli.outputHelp()
    exit()
  })

cli.help()
cli.parse()
