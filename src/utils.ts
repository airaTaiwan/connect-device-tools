import process from 'node:process'
import consola from 'consola'

export function performanceUtils(): () => number {
  let startedAt = performance.now()
  const cost = (): number => {
    const now = performance.now()
    const cost = now - startedAt
    startedAt = now
    return cost
  }
  return cost
}

/**
 * Wrapper to exit the process if the user presses CTRL+C.
 */
export async function prompt(message: string, options: any): Promise<any> {
  const response = await consola.prompt(message, options)
  if (response.toString() === 'Symbol(clack:cancel)') {
    exit()
  }
  return response
}

export function exit(): void {
  process.exit(0)
}
