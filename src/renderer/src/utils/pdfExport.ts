// [id, occurred_at, incident_type, location_name, class_name, child_name, injury_type_name, description]
export type IncidentRow = [number, string, string, string, string, string, string, string]

export function buildPdfFileName(from: string): string {
  if (!from) return 'report.pdf'
  const yyyymm = from.slice(0, 4) + from.slice(5, 7)
  return `report_${yyyymm}.pdf`
}

const ROWS_PER_PAGE = 30

export function splitIncidentsIntoPages(incidents: IncidentRow[]): IncidentRow[][] {
  if (incidents.length === 0) return [[]]
  return Array.from({ length: Math.ceil(incidents.length / ROWS_PER_PAGE) }, (_, i) =>
    incidents.slice(i * ROWS_PER_PAGE, (i + 1) * ROWS_PER_PAGE)
  )
}
