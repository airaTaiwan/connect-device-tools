import { fileURLToPath } from 'node:url'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
  alias: {
    '~': fileURLToPath(new URL('./src', import.meta.url)),
  },
  externals: ['consola', 'cac'],
})
