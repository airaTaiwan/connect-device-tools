import cac from 'cac'
import { generateReportLastUpdate } from '~/modules/reportLastUpdate'
import { generateReportNotWorking } from '~/modules/reportNotWorking'
import { exit } from './utils'

const cli = cac()

cli
  .command('report', 'generate report')
  .option('--type <type>', 'Set report type', {
    default: 'last-update',
  })
  .action((options) => {
    if (options.type === 'not-working') {
      generateReportNotWorking()
    }
    else if (options.type === 'last-update') {
      generateReportLastUpdate()
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
