export type Period = 'month' | 'quarter' | 'year'

export const QUARTER_RANGES = [
  { startMonth: 4,  endMonth: 6,  yearOffset: 0 },
  { startMonth: 7,  endMonth: 9,  yearOffset: 0 },
  { startMonth: 10, endMonth: 12, yearOffset: 0 },
  { startMonth: 1,  endMonth: 3,  yearOffset: 1 },
]

export const QUARTER_LABELS = [
  '第1四半期（4〜6月）',
  '第2四半期（7〜9月）',
  '第3四半期（10〜12月）',
  '第4四半期（1〜3月）',
]

export function getPeriodRange(
  period: Period,
  year: number,
  month: number,
  quarter: number
): { from: string; to: string } {
  if (period === 'month') {
    const lastDay = new Date(year, month, 0).getDate()
    const m = String(month).padStart(2, '0')
    return { from: `${year}-${m}-01`, to: `${year}-${m}-${lastDay}` }
  }
  if (period === 'quarter') {
    const { startMonth, endMonth, yearOffset } = QUARTER_RANGES[quarter - 1]
    const qYear = year + yearOffset
    const lastDay = new Date(qYear, endMonth, 0).getDate()
    return {
      from: `${qYear}-${String(startMonth).padStart(2, '0')}-01`,
      to:   `${qYear}-${String(endMonth).padStart(2, '0')}-${lastDay}`,
    }
  }
  return {
    from: `${year}-04-01`,
    to:   `${year + 1}-03-31`,
  }
}
