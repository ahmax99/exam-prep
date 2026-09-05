export const toPercent = (value: number, total: number) =>
  total === 0 ? 0 : Math.round((value / total) * 100)
