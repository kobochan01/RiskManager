export function buildPdfFileName(from: string): string {
  if (!from) return 'report.pdf'
  const yyyymm = from.slice(0, 7).replace('-', '')
  return `report_${yyyymm}.pdf`
}
