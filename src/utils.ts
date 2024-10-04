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
